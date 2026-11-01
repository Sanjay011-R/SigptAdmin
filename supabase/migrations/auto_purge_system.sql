-- ===============================================================
-- SUPABASE MIGRATION: DYNAMIC AUTO-PURGE & CLEANUP SYSTEM
-- (Excludes job postings — purges candidate apps & requests only)
-- ===============================================================

-- 1. Ensure platform_settings has auto_delete_audit_logs column
ALTER TABLE IF EXISTS public.platform_settings 
  ADD COLUMN IF NOT EXISTS auto_delete_audit_logs BOOLEAN DEFAULT true,
  DROP COLUMN IF EXISTS job_default_status,
  DROP COLUMN IF EXISTS job_auto_expiry,
  DROP COLUMN IF EXISTS job_auto_delete_days,
  DROP COLUMN IF EXISTS auto_delete_job_data,
  DROP COLUMN IF EXISTS job_notif_email,
  DROP COLUMN IF EXISTS notify_on_new_app;

-- 2. Create or Replace Comprehensive System Auto-Purge Function
CREATE OR REPLACE FUNCTION run_system_auto_purge()
RETURNS jsonb AS $$
DECLARE
  v_settings RECORD;
  v_cand_delete_days INT := 180;
  v_req_purge_days INT := 365;
  v_audit_purge_days INT := 45;
  v_auto_delete_cands BOOLEAN := true;
  v_auto_delete_audits BOOLEAN := true;

  v_apps_deleted INT := 0;
  v_reqs_deleted INT := 0;
  v_audits_deleted INT := 0;
BEGIN
  -- Fetch current dynamic platform settings
  SELECT * INTO v_settings FROM platform_settings WHERE id = 'default' LIMIT 1;

  IF FOUND THEN
    -- Check Candidate Retention (Bypass deletion if 'never')
    IF LOWER(COALESCE(v_settings.candidate_purge_retention, '')) = 'never' THEN
      v_cand_delete_days := 0;
      v_auto_delete_cands := false;
    ELSE
      v_cand_delete_days := COALESCE(NULLIF(regexp_replace(v_settings.candidate_purge_retention, '\D', '', 'g'), '')::INT, 180);
      v_auto_delete_cands := COALESCE(v_settings.auto_delete_candidate_data, true);
    END IF;

    v_req_purge_days := COALESCE(v_settings.request_purge_days, 365);

    -- Check Audit Log Retention (Bypass deletion if 'never')
    IF LOWER(COALESCE(v_settings.audit_log_retention, '')) = 'never' THEN
      v_audit_purge_days := 0;
      v_auto_delete_audits := false;
    ELSE
      v_audit_purge_days := COALESCE(NULLIF(regexp_replace(v_settings.audit_log_retention, '\D', '', 'g'), '')::INT, 45);
      v_auto_delete_audits := COALESCE(v_settings.auto_delete_audit_logs, true);
    END IF;
  END IF;

  -- 1. Delete Candidate Applications past retention threshold (skipped if 'never')
  IF v_auto_delete_cands = true AND v_cand_delete_days > 0 THEN
    WITH del_apps AS (
      DELETE FROM candidate_applications
      WHERE (
        applied_at IS NOT NULL 
        AND applied_at::timestamptz < NOW() - (v_cand_delete_days || ' days')::INTERVAL
      )
      RETURNING id
    )
    SELECT COUNT(*) INTO v_apps_deleted FROM del_apps;
  END IF;

  -- 2. Delete Contact Requests past retention threshold
  IF v_req_purge_days > 0 THEN
    WITH del_reqs AS (
      DELETE FROM contact_requests
      WHERE created_at < NOW() - (v_req_purge_days || ' days')::INTERVAL
      RETURNING id
    )
    SELECT COUNT(*) INTO v_reqs_deleted FROM del_reqs;
  END IF;

  -- 3. Delete Audit Logs past retention threshold + remove Page Accessed clutter
  IF v_auto_delete_audits = true AND v_audit_purge_days > 0 THEN
    WITH del_audits AS (
      DELETE FROM audit_logs
      WHERE (
        (created_at IS NOT NULL AND created_at < NOW() - (v_audit_purge_days || ' days')::INTERVAL)
        OR type = 'access'
        OR action ILIKE 'Page Accessed:%'
      )
      RETURNING id
    )
    SELECT COUNT(*) INTO v_audits_deleted FROM del_audits;
  ELSE
    -- If audit retention is 'never' or auto_delete is false, keep all mutation logs permanently and only clean Page Accessed view clutter
    WITH del_audits AS (
      DELETE FROM audit_logs
      WHERE type = 'access' OR action ILIKE 'Page Accessed:%'
      RETURNING id
    )
    SELECT COUNT(*) INTO v_audits_deleted FROM del_audits;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'applications_deleted', v_apps_deleted,
    'requests_deleted', v_reqs_deleted,
    'audit_logs_deleted', v_audits_deleted
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION run_system_auto_purge() TO anon, authenticated, service_role;

-- 3. Optional: Schedule via pg_cron extension if enabled
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('daily_system_auto_purge');
    PERFORM cron.schedule(
      'daily_system_auto_purge',
      '0 0 * * *', -- Daily at midnight UTC
      'SELECT run_system_auto_purge();'
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END;
$$;
