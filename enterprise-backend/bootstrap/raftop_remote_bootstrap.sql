--
-- PostgreSQL database dump
--

\restrict JOGQ4tBiSJNr9TEPOx9uPVGDCOR9gIKUbz5TB5MDwiR8LkyehczhfCMZq4S7Zmw

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: action_group_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.action_group_events (
    id integer NOT NULL,
    patient_action_status_id integer NOT NULL,
    event_type character varying(50) NOT NULL,
    note text,
    created_by integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: action_group_events_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.action_group_events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: action_group_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.action_group_events_id_seq OWNED BY public.action_group_events.id;


--
-- Name: action_groups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.action_groups (
    id integer NOT NULL,
    code character varying(50) NOT NULL,
    name character varying(120) NOT NULL,
    description text,
    default_priority character varying(20) DEFAULT 'medium'::character varying NOT NULL,
    color character varying(20) DEFAULT 'blue'::character varying,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: action_groups_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.action_groups_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: action_groups_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.action_groups_id_seq OWNED BY public.action_groups.id;


--
-- Name: alerts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.alerts (
    id integer NOT NULL,
    patient_id integer,
    alert_type character varying(50),
    message text,
    severity character varying(20),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: alerts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.alerts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: alerts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.alerts_id_seq OWNED BY public.alerts.id;


--
-- Name: atlas_alerts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.atlas_alerts (
    id text NOT NULL,
    tenant_id text NOT NULL,
    case_id text,
    title text,
    patient_name text,
    severity text DEFAULT 'warning'::text,
    message text,
    status text DEFAULT 'open'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: atlas_auto_actions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.atlas_auto_actions (
    id integer NOT NULL,
    patient_action_status_id integer NOT NULL,
    patient_id integer NOT NULL,
    action_type character varying(50) NOT NULL,
    title text NOT NULL,
    description text,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    executed_at timestamp without time zone,
    tenant_id text,
    case_id text,
    rule_name text,
    patient_name text,
    action text,
    owner text DEFAULT 'System'::text,
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: atlas_auto_actions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.atlas_auto_actions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: atlas_auto_actions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.atlas_auto_actions_id_seq OWNED BY public.atlas_auto_actions.id;


--
-- Name: atlas_cases; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.atlas_cases (
    id text NOT NULL,
    tenant_id text NOT NULL,
    patient_id text,
    patient_name text,
    doctor_name text,
    action_group_name text,
    reason text,
    priority text DEFAULT 'medium'::text,
    score numeric DEFAULT 0,
    revenue_estimate numeric DEFAULT 0,
    usage_avg_7d numeric DEFAULT 0,
    ahi_avg_7d numeric DEFAULT 0,
    assigned_to text,
    status text DEFAULT 'open'::text,
    lane text DEFAULT 'today'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: atlas_tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.atlas_tasks (
    id text NOT NULL,
    tenant_id text NOT NULL,
    case_id text,
    patient_name text,
    title text,
    owner text,
    priority text DEFAULT 'medium'::text,
    status text DEFAULT 'open'::text,
    due_at timestamp with time zone,
    action_group_name text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id integer NOT NULL,
    user_id integer,
    action character varying(100),
    entity character varying(100),
    entity_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.audit_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;


--
-- Name: billing_deals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.billing_deals (
    id text NOT NULL,
    tenant_id text NOT NULL,
    name text,
    stage text,
    value numeric DEFAULT 0,
    probability numeric DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: clinical_notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clinical_notes (
    id integer NOT NULL,
    patient_id integer,
    doctor_id integer,
    note text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: clinical_notes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.clinical_notes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: clinical_notes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.clinical_notes_id_seq OWNED BY public.clinical_notes.id;


--
-- Name: compliance; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.compliance (
    id integer NOT NULL,
    patient_id integer,
    date date NOT NULL,
    hours_used numeric(4,2),
    ahi numeric(4,2),
    mask_leak numeric(5,2),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: compliance_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.compliance_entries (
    id integer NOT NULL,
    patient_id integer NOT NULL,
    entry_date date NOT NULL,
    hours_used numeric(5,2) DEFAULT 0 NOT NULL,
    source character varying(30) DEFAULT 'manual'::character varying NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: compliance_entries_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.compliance_entries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: compliance_entries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.compliance_entries_id_seq OWNED BY public.compliance_entries.id;


--
-- Name: compliance_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.compliance_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: compliance_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.compliance_id_seq OWNED BY public.compliance.id;


--
-- Name: compliance_periods; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.compliance_periods (
    id integer NOT NULL,
    patient_id integer NOT NULL,
    period_start date NOT NULL,
    period_end date NOT NULL,
    target_hours integer DEFAULT 80 NOT NULL,
    total_hours numeric(7,2) DEFAULT 0 NOT NULL,
    status character varying(30) DEFAULT 'pending'::character varying NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: compliance_periods_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.compliance_periods_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: compliance_periods_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.compliance_periods_id_seq OWNED BY public.compliance_periods.id;


--
-- Name: compliance_summary; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.compliance_summary (
    id integer NOT NULL,
    patient_id integer,
    month integer,
    year integer,
    total_hours numeric(6,2),
    compliance_percentage integer,
    status character varying(20)
);


--
-- Name: compliance_summary_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.compliance_summary_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: compliance_summary_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.compliance_summary_id_seq OWNED BY public.compliance_summary.id;


--
-- Name: cpap_devices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cpap_devices (
    id integer NOT NULL,
    serial_number text,
    model text,
    pressure_setting numeric,
    setup_date date,
    patient_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    vendor character varying(50),
    external_device_id character varying(255)
);


--
-- Name: cpap_devices_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cpap_devices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cpap_devices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cpap_devices_id_seq OWNED BY public.cpap_devices.id;


--
-- Name: device_inventory; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.device_inventory (
    id integer NOT NULL,
    serial_number character varying(255),
    brand character varying(50),
    model character varying(100),
    status character varying(50) DEFAULT 'available'::character varying,
    assigned_patient integer,
    assigned_date date,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: device_inventory_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.device_inventory_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: device_inventory_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.device_inventory_id_seq OWNED BY public.device_inventory.id;


--
-- Name: devices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.devices (
    id text NOT NULL,
    tenant_id text NOT NULL,
    patient_id integer,
    serial text,
    usage_7d numeric DEFAULT 0,
    usage_avg_7d numeric DEFAULT 0,
    leak numeric DEFAULT 0,
    mask_leak numeric DEFAULT 0,
    status text,
    last_sync timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: doctor_subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.doctor_subscriptions (
    id integer NOT NULL,
    doctor_id text NOT NULL,
    plan_name character varying(100) NOT NULL,
    status character varying(50) DEFAULT 'active'::character varying NOT NULL,
    price_monthly numeric(10,2) DEFAULT 0,
    start_date date DEFAULT CURRENT_DATE,
    end_date date,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    tenant_id text,
    plan text DEFAULT 'Starter'::text,
    patient_count integer DEFAULT 0,
    monthly_fee numeric DEFAULT 0,
    stripe_customer_id text,
    stripe_subscription_id text,
    current_period_start timestamp with time zone,
    current_period_end timestamp with time zone,
    last_invoice_at timestamp with time zone,
    updated_at timestamp with time zone DEFAULT now(),
    doctor_name text,
    specialty text
);


--
-- Name: doctor_subscriptions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.doctor_subscriptions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: doctor_subscriptions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.doctor_subscriptions_id_seq OWNED BY public.doctor_subscriptions.id;


--
-- Name: doctors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.doctors (
    id text NOT NULL,
    tenant_id text NOT NULL,
    name text,
    email text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: followup_reminders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.followup_reminders (
    id integer NOT NULL,
    patient_id integer,
    doctor_id integer,
    reminder_date date NOT NULL,
    status character varying(50) DEFAULT 'pending'::character varying,
    note text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: followup_reminders_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.followup_reminders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: followup_reminders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.followup_reminders_id_seq OWNED BY public.followup_reminders.id;


--
-- Name: followups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.followups (
    id text NOT NULL,
    tenant_id text NOT NULL,
    patient_id integer,
    reason text,
    owner text,
    priority text DEFAULT 'normal'::text,
    outcome text,
    next_action text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: integrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.integrations (
    id text NOT NULL,
    tenant_id text NOT NULL,
    name text,
    provider text,
    status text DEFAULT 'pending'::text,
    mode text DEFAULT 'api'::text,
    last_sync_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notes (
    id text NOT NULL,
    tenant_id text NOT NULL,
    patient_id integer,
    author text,
    category text DEFAULT 'general'::text,
    text text,
    note text,
    body text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: notification_queue; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification_queue (
    id integer NOT NULL,
    patient_id integer,
    patient_action_status_id integer,
    auto_action_id integer,
    channel character varying(30) NOT NULL,
    recipient text,
    subject text,
    message text NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    error_message text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    sent_at timestamp without time zone
);


--
-- Name: notification_queue_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.notification_queue_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: notification_queue_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.notification_queue_id_seq OWNED BY public.notification_queue.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id text NOT NULL,
    tenant_id text NOT NULL,
    title text,
    channel text DEFAULT 'internal'::text,
    recipient text,
    status text DEFAULT 'pending'::text,
    body text,
    message text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: patient_action_status; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patient_action_status (
    id integer NOT NULL,
    patient_id integer NOT NULL,
    device_id integer,
    action_group_id integer NOT NULL,
    reason text,
    score integer DEFAULT 0 NOT NULL,
    priority character varying(20) DEFAULT 'low'::character varying NOT NULL,
    status character varying(20) DEFAULT 'open'::character varying NOT NULL,
    assigned_to integer,
    last_contact_at timestamp without time zone,
    next_action_at timestamp without time zone,
    no_data_days integer DEFAULT 0,
    usage_avg_3d numeric(6,2) DEFAULT 0,
    usage_avg_7d numeric(6,2) DEFAULT 0,
    ahi_avg_7d numeric(6,2) DEFAULT 0,
    leak_avg_7d numeric(6,2) DEFAULT 0,
    unresolved_days integer DEFAULT 0,
    revenue_potential numeric(12,2) DEFAULT 0,
    is_current boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    revenue_estimate numeric(12,2) DEFAULT 0 NOT NULL,
    ai_score numeric DEFAULT 0,
    risk_level character varying(20) DEFAULT 'low'::character varying
);


--
-- Name: patient_action_status_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.patient_action_status_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: patient_action_status_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.patient_action_status_id_seq OWNED BY public.patient_action_status.id;


--
-- Name: patient_activation_codes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patient_activation_codes (
    id integer NOT NULL,
    patient_id integer,
    activation_code character varying(50),
    plan_name character varying(100),
    price_yearly numeric(10,2),
    status character varying(50) DEFAULT 'unused'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: patient_activation_codes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.patient_activation_codes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: patient_activation_codes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.patient_activation_codes_id_seq OWNED BY public.patient_activation_codes.id;


--
-- Name: patient_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patient_events (
    id integer NOT NULL,
    patient_id integer,
    event_type text,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: patient_events_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.patient_events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: patient_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.patient_events_id_seq OWNED BY public.patient_events.id;


--
-- Name: patient_metrics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patient_metrics (
    id integer NOT NULL,
    patient_id integer NOT NULL,
    usage_avg_3d numeric(6,2) DEFAULT 0,
    usage_avg_7d numeric(6,2) DEFAULT 0,
    ahi_avg_7d numeric(6,2) DEFAULT 0,
    leak_avg_7d numeric(6,2) DEFAULT 0,
    no_data_days integer DEFAULT 0,
    days_since_setup integer DEFAULT 9999,
    unresolved_days integer DEFAULT 0,
    accessory_renewal_due_days integer DEFAULT 9999,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: patient_metrics_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.patient_metrics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: patient_metrics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.patient_metrics_id_seq OWNED BY public.patient_metrics.id;


--
-- Name: patient_subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patient_subscriptions (
    id integer NOT NULL,
    patient_id integer,
    plan_name character varying(100),
    price_yearly numeric(10,2),
    start_date date,
    end_date date,
    status character varying(50) DEFAULT 'active'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: patient_subscriptions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.patient_subscriptions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: patient_subscriptions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.patient_subscriptions_id_seq OWNED BY public.patient_subscriptions.id;


--
-- Name: patients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patients (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    age integer,
    diagnosis character varying(255),
    phone character varying(50),
    cpap_hours integer DEFAULT 0,
    compliance_status character varying(50) DEFAULT 'pending'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    device_serial character varying(100),
    doctor_id integer,
    email character varying(255),
    password character varying(255),
    risk_score integer DEFAULT 0,
    risk_level character varying(50) DEFAULT 'LOW'::character varying,
    tenant_id text
);


--
-- Name: patients_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.patients_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: patients_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.patients_id_seq OWNED BY public.patients.id;


--
-- Name: payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payments (
    id bigint NOT NULL,
    tenant_id text NOT NULL,
    doctor_id text,
    customer_name text,
    customer_email text,
    order_type text DEFAULT 'doctor_subscription'::text,
    payment_method text NOT NULL,
    amount numeric DEFAULT 0 NOT NULL,
    currency text DEFAULT 'EUR'::text NOT NULL,
    status text DEFAULT 'created'::text NOT NULL,
    provider text,
    provider_order_id text,
    provider_payment_id text,
    provider_client_secret text,
    bank_reference text,
    proof_url text,
    notes text,
    description text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    paid_at timestamp with time zone
);


--
-- Name: payments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.payments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: payments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.payments_id_seq OWNED BY public.payments.id;


--
-- Name: referrals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.referrals (
    id text NOT NULL,
    tenant_id text NOT NULL,
    patient_name text,
    ref_doctor text,
    specialty text,
    stage text DEFAULT 'new'::text,
    source text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscriptions (
    id integer NOT NULL,
    doctor_id integer NOT NULL,
    plan_name character varying(100) NOT NULL,
    price_yearly numeric(10,2) DEFAULT 0,
    billing_cycle character varying(50) DEFAULT 'yearly'::character varying,
    status character varying(50) DEFAULT 'active'::character varying,
    start_date date DEFAULT CURRENT_DATE,
    end_date date NOT NULL,
    auto_renew boolean DEFAULT false,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: subscriptions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.subscriptions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: subscriptions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.subscriptions_id_seq OWNED BY public.subscriptions.id;


--
-- Name: tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tasks (
    id integer NOT NULL,
    patient_id integer,
    action_group_id integer,
    title text NOT NULL,
    description text,
    status character varying(20) DEFAULT 'open'::character varying NOT NULL,
    priority character varying(20),
    assigned_to integer,
    due_date timestamp without time zone,
    sla_status character varying(20) DEFAULT 'on_time'::character varying,
    created_at timestamp without time zone DEFAULT now(),
    completed_at timestamp without time zone,
    tenant_id text
);


--
-- Name: tasks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tasks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tasks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tasks_id_seq OWNED BY public.tasks.id;


--
-- Name: tenant_branding; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_branding (
    tenant_id text NOT NULL,
    company_name text,
    logo_url text,
    primary_color text DEFAULT '#2563eb'::text,
    secondary_color text DEFAULT '#0f172a'::text,
    accent_color text DEFAULT '#10b981'::text,
    white_label boolean DEFAULT false,
    custom_domain text,
    support_email text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: tenant_features; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_features (
    id text NOT NULL,
    tenant_id text NOT NULL,
    key text,
    name text,
    enabled boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: tenant_modules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_modules (
    id text NOT NULL,
    tenant_id text NOT NULL,
    key text,
    name text,
    enabled boolean DEFAULT false,
    required_plan text DEFAULT 'starter'::text,
    status text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: tenant_payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_payments (
    id text NOT NULL,
    tenant_id text NOT NULL,
    doctor_id text,
    customer_name text,
    customer_email text,
    description text,
    amount numeric DEFAULT 0,
    currency text DEFAULT 'EUR'::text,
    payment_method text,
    status text DEFAULT 'pending'::text,
    provider_order_id text,
    bank_reference text,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: tenant_workspace_branding; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_workspace_branding (
    tenant_id text NOT NULL,
    company_name text,
    logo_url text,
    primary_color text,
    secondary_color text,
    accent_color text,
    white_label boolean DEFAULT false,
    custom_domain text,
    support_email text,
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: tenant_workspace_devices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_workspace_devices (
    id text NOT NULL,
    tenant_id text NOT NULL,
    serial text,
    patient_name text,
    doctor_name text,
    last_sync text,
    usage_7d numeric DEFAULT 0,
    leak numeric DEFAULT 0,
    status text DEFAULT 'online'::text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: tenant_workspace_followups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_workspace_followups (
    id text NOT NULL,
    tenant_id text NOT NULL,
    patient_name text,
    reason text,
    owner text,
    priority text DEFAULT 'normal'::text,
    outcome text,
    next_action text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: tenant_workspace_integrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_workspace_integrations (
    id text NOT NULL,
    tenant_id text NOT NULL,
    name text,
    provider text,
    status text DEFAULT 'pending'::text,
    mode text DEFAULT 'api'::text,
    last_sync text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: tenant_workspace_modules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_workspace_modules (
    id text NOT NULL,
    tenant_id text NOT NULL,
    module_key text,
    name text,
    enabled boolean DEFAULT true,
    required_plan text DEFAULT 'starter'::text,
    status text DEFAULT 'active'::text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: tenant_workspace_notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_workspace_notes (
    id text NOT NULL,
    tenant_id text NOT NULL,
    patient_name text,
    author text,
    category text,
    created_label text,
    note_text text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: tenant_workspace_notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_workspace_notifications (
    id text NOT NULL,
    tenant_id text NOT NULL,
    title text,
    channel text,
    recipient text,
    status text DEFAULT 'pending'::text,
    body text,
    created_label text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: tenant_workspace_patients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_workspace_patients (
    id text NOT NULL,
    tenant_id text NOT NULL,
    full_name text,
    doctor_name text,
    serial text,
    compliance_hours numeric DEFAULT 0,
    ahi numeric DEFAULT 0,
    status text DEFAULT 'stable'::text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: tenant_workspace_referrals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_workspace_referrals (
    id text NOT NULL,
    tenant_id text NOT NULL,
    patient_name text,
    ref_doctor text,
    specialty text,
    stage text DEFAULT 'new'::text,
    source text,
    created_label text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: tenant_workspace_tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_workspace_tasks (
    id text NOT NULL,
    tenant_id text NOT NULL,
    title text,
    owner text,
    due text,
    sla text DEFAULT 'scheduled'::text,
    status text DEFAULT 'open'::text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: tenant_workspace_users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_workspace_users (
    id text NOT NULL,
    tenant_id text NOT NULL,
    name text,
    email text,
    role text DEFAULT 'viewer'::text,
    status text DEFAULT 'active'::text,
    last_active text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: tenants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenants (
    id text NOT NULL,
    name text NOT NULL,
    plan text DEFAULT 'enterprise'::text,
    status text DEFAULT 'active'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: usage_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usage_logs (
    id integer NOT NULL,
    patient_id integer,
    usage_date date NOT NULL,
    hours_used numeric(4,2) NOT NULL,
    source character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    device_serial character varying(100),
    import_batch_id character varying(60),
    hours numeric(5,2),
    ahi numeric(10,2),
    leak numeric(10,2),
    pressure numeric(10,2),
    vendor character varying(50),
    external_patient_id character varying(255),
    raw_payload jsonb
);


--
-- Name: usage_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.usage_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: usage_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.usage_logs_id_seq OWNED BY public.usage_logs.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    password character varying(255) NOT NULL,
    role character varying(20) DEFAULT 'admin'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    name character varying(255),
    email character varying(255),
    subdomain character varying(100),
    clinic_name character varying(255),
    logo_url text,
    account_status character varying(50) DEFAULT 'active'::character varying,
    clinic_id integer,
    tenant_id text
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: action_group_events id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.action_group_events ALTER COLUMN id SET DEFAULT nextval('public.action_group_events_id_seq'::regclass);


--
-- Name: action_groups id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.action_groups ALTER COLUMN id SET DEFAULT nextval('public.action_groups_id_seq'::regclass);


--
-- Name: alerts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alerts ALTER COLUMN id SET DEFAULT nextval('public.alerts_id_seq'::regclass);


--
-- Name: atlas_auto_actions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atlas_auto_actions ALTER COLUMN id SET DEFAULT nextval('public.atlas_auto_actions_id_seq'::regclass);


--
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- Name: clinical_notes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinical_notes ALTER COLUMN id SET DEFAULT nextval('public.clinical_notes_id_seq'::regclass);


--
-- Name: compliance id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.compliance ALTER COLUMN id SET DEFAULT nextval('public.compliance_id_seq'::regclass);


--
-- Name: compliance_entries id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.compliance_entries ALTER COLUMN id SET DEFAULT nextval('public.compliance_entries_id_seq'::regclass);


--
-- Name: compliance_periods id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.compliance_periods ALTER COLUMN id SET DEFAULT nextval('public.compliance_periods_id_seq'::regclass);


--
-- Name: compliance_summary id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.compliance_summary ALTER COLUMN id SET DEFAULT nextval('public.compliance_summary_id_seq'::regclass);


--
-- Name: cpap_devices id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cpap_devices ALTER COLUMN id SET DEFAULT nextval('public.cpap_devices_id_seq'::regclass);


--
-- Name: device_inventory id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.device_inventory ALTER COLUMN id SET DEFAULT nextval('public.device_inventory_id_seq'::regclass);


--
-- Name: doctor_subscriptions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.doctor_subscriptions ALTER COLUMN id SET DEFAULT nextval('public.doctor_subscriptions_id_seq'::regclass);


--
-- Name: followup_reminders id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.followup_reminders ALTER COLUMN id SET DEFAULT nextval('public.followup_reminders_id_seq'::regclass);


--
-- Name: notification_queue id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_queue ALTER COLUMN id SET DEFAULT nextval('public.notification_queue_id_seq'::regclass);


--
-- Name: patient_action_status id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_action_status ALTER COLUMN id SET DEFAULT nextval('public.patient_action_status_id_seq'::regclass);


--
-- Name: patient_activation_codes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_activation_codes ALTER COLUMN id SET DEFAULT nextval('public.patient_activation_codes_id_seq'::regclass);


--
-- Name: patient_events id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_events ALTER COLUMN id SET DEFAULT nextval('public.patient_events_id_seq'::regclass);


--
-- Name: patient_metrics id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_metrics ALTER COLUMN id SET DEFAULT nextval('public.patient_metrics_id_seq'::regclass);


--
-- Name: patient_subscriptions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_subscriptions ALTER COLUMN id SET DEFAULT nextval('public.patient_subscriptions_id_seq'::regclass);


--
-- Name: patients id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patients ALTER COLUMN id SET DEFAULT nextval('public.patients_id_seq'::regclass);


--
-- Name: payments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments ALTER COLUMN id SET DEFAULT nextval('public.payments_id_seq'::regclass);


--
-- Name: subscriptions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions ALTER COLUMN id SET DEFAULT nextval('public.subscriptions_id_seq'::regclass);


--
-- Name: tasks id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks ALTER COLUMN id SET DEFAULT nextval('public.tasks_id_seq'::regclass);


--
-- Name: usage_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usage_logs ALTER COLUMN id SET DEFAULT nextval('public.usage_logs_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: action_group_events; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.action_group_events (id, patient_action_status_id, event_type, note, created_by, created_at) FROM stdin;
1	8	assigned	Assigned to user 1	\N	2026-03-24 00:10:35.614404
2	8	contacted	Patient contacted from ATLAS Queue	\N	2026-03-24 00:10:39.016951
3	8	task_requested	Task requested: ATLAS follow-up: Μαρία Κωνσταντίνου	\N	2026-03-24 00:10:41.973677
4	7	assigned	Assigned to user 1	\N	2026-03-24 00:10:45.024561
5	6	assigned	Assigned to user 1	\N	2026-03-24 00:10:46.224506
6	5	assigned	Assigned to user 1	\N	2026-03-24 00:10:47.024291
7	9	created	New setup: 20 days	\N	2026-03-24 00:20:54.649077
8	10	created	New setup: 20 days	\N	2026-03-24 00:20:54.657197
9	11	created	New setup: 20 days	\N	2026-03-24 00:20:54.665156
10	12	created	New setup: 20 days	\N	2026-03-24 00:20:54.670038
11	13	created	New setup: 20 days	\N	2026-03-24 00:27:21.31776
12	14	created	New setup: 20 days	\N	2026-03-24 00:27:21.321008
13	15	created	New setup: 20 days	\N	2026-03-24 00:27:21.324231
14	16	created	New setup: 20 days	\N	2026-03-24 00:27:21.327274
15	17	created	New setup: 20 days | Escalated after 2 unresolved days	\N	2026-03-24 00:33:29.840269
16	18	created	New setup: 20 days | Escalated after 2 unresolved days	\N	2026-03-24 00:33:29.843141
17	19	created	New setup: 20 days | Escalated after 2 unresolved days	\N	2026-03-24 00:33:29.845661
18	20	created	New setup: 20 days | Escalated after 2 unresolved days	\N	2026-03-24 00:33:29.848548
19	21	created	New setup: 20 days | Escalated after 2 unresolved days	\N	2026-03-24 00:51:08.462066
20	22	created	New setup: 20 days | Escalated after 2 unresolved days	\N	2026-03-24 00:51:08.469258
21	23	created	New setup: 20 days | Escalated after 2 unresolved days	\N	2026-03-24 00:51:08.473299
22	24	created	New setup: 20 days | Escalated after 2 unresolved days	\N	2026-03-24 00:51:08.476287
23	25	created	New setup: 20 days | Escalated after 2 unresolved days	\N	2026-03-24 01:12:51.936825
24	26	created	New setup: 20 days | Escalated after 2 unresolved days	\N	2026-03-24 01:12:51.942021
25	27	created	New setup: 20 days | Escalated after 2 unresolved days	\N	2026-03-24 01:12:51.943425
26	28	created	New setup: 20 days | Escalated after 2 unresolved days	\N	2026-03-24 01:12:51.944919
27	29	created	New setup: 20 days | Escalated after 2 unresolved days	\N	2026-03-24 01:22:20.809258
28	30	created	New setup: 20 days | Escalated after 2 unresolved days	\N	2026-03-24 01:22:20.811862
29	31	created	New setup: 20 days | Escalated after 2 unresolved days	\N	2026-03-24 01:22:20.814601
30	32	created	New setup: 20 days | Escalated after 2 unresolved days	\N	2026-03-24 01:22:20.816347
31	33	created	New setup: 20 days | Escalated after 2 unresolved days	\N	2026-03-24 18:41:11.933379
32	34	created	New setup: 20 days | Escalated after 2 unresolved days	\N	2026-03-24 18:41:11.951463
33	35	created	New setup: 20 days | Escalated after 2 unresolved days	\N	2026-03-24 18:41:11.953208
34	36	created	New setup: 20 days | Escalated after 2 unresolved days	\N	2026-03-24 18:41:11.956864
35	37	created	New setup: 20 days | Escalated after 2 unresolved days	\N	2026-03-25 08:40:03.967032
36	38	created	New setup: 20 days | Escalated after 2 unresolved days	\N	2026-03-25 08:40:03.984696
37	39	created	New setup: 20 days | Escalated after 2 unresolved days	\N	2026-03-25 08:40:03.986857
38	40	created	New setup: 20 days | Escalated after 2 unresolved days	\N	2026-03-25 08:40:03.989099
39	67	ai_auto_action_executed	AI auto action executed: doctor_alert | Task created: URGENT AI Alert: Μαρία Κωνσταντίνου	\N	2026-03-28 20:47:37.093107
40	68	ai_auto_action_executed	AI auto action executed: doctor_alert | Task created: URGENT AI Alert: CPAP Test Patient	\N	2026-03-28 20:47:41.927487
41	68	ai_auto_action_executed	AI auto action executed: doctor_alert | Task created: URGENT AI Alert: CPAP Test Patient	\N	2026-03-29 09:17:56.78298
42	67	assigned	Case assigned to user 1	\N	2026-03-29 10:05:07.787818
43	67	contacted	Patient contacted from ATLAS Queue	\N	2026-03-29 10:05:09.694543
44	67	task_created	Task created: ATLAS follow-up: Μαρία Κωνσταντίνου	\N	2026-03-29 10:05:11.64168
45	67	resolved	Resolved from ATLAS Queue	\N	2026-03-29 10:05:14.969841
46	76	assigned	Case unassigned	\N	2026-03-29 14:08:12.97628
47	76	assigned	Case unassigned	\N	2026-03-29 14:08:13.6553
48	76	resolved	Resolved from ATLAS queue	\N	2026-03-29 14:08:14.746795
49	75	resolved	Resolved from ATLAS queue	\N	2026-03-29 14:08:16.555202
\.


--
-- Data for Name: action_groups; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.action_groups (id, code, name, description, default_priority, color, is_active, created_at, updated_at) FROM stdin;
1	CRITICAL_CLINICAL	Critical Clinical	Urgent therapy or usage issues	critical	red	t	2026-03-23 22:08:04.658615	2026-03-23 22:08:04.658615
2	COMPLIANCE_RISK	Compliance Risk	Risk of non-compliance	high	orange	t	2026-03-23 22:08:04.658615	2026-03-23 22:08:04.658615
3	NO_DATA	No Data / Lost Contact	No recent device data or no contact	high	yellow	t	2026-03-23 22:08:04.658615	2026-03-23 22:08:04.658615
4	NEW_SETUP	New Setup Monitoring	First 30 days after setup	medium	blue	t	2026-03-23 22:08:04.658615	2026-03-23 22:08:04.658615
5	THERAPY_ISSUES	Therapy Issues	Leak/AHI/comfort problems	high	orange	t	2026-03-23 22:08:04.658615	2026-03-23 22:08:04.658615
6	HIGH_VALUE	High Value Follow-Up	Revenue or retention opportunity	medium	green	t	2026-03-23 22:08:04.658615	2026-03-23 22:08:04.658615
\.


--
-- Data for Name: alerts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.alerts (id, patient_id, alert_type, message, severity, created_at) FROM stdin;
\.


--
-- Data for Name: atlas_alerts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.atlas_alerts (id, tenant_id, case_id, title, patient_name, severity, message, status, created_at, updated_at) FROM stdin;
ALA-001	demo-tenant	AT-001	Critical non-compliance	Dimitris Leonidas	critical	Usage dropped sharply and no recent recovery detected.	open	2026-04-04 19:52:32.062704+03	2026-04-04 19:52:32.062704+03
ALA-002	demo-tenant	AT-002	Offline device risk	Eleni Kosta	high	No recent sync after callback request.	open	2026-04-04 19:52:32.067507+03	2026-04-04 19:52:32.067507+03
ALA-003	demo-tenant	AT-003	Leak trend watch	Maria Ioannou	warning	Leak increased over two consecutive nights.	monitoring	2026-04-04 19:52:32.069755+03	2026-04-04 19:52:32.069755+03
\.


--
-- Data for Name: atlas_auto_actions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.atlas_auto_actions (id, patient_action_status_id, patient_id, action_type, title, description, status, created_at, executed_at, tenant_id, case_id, rule_name, patient_name, action, owner, updated_at) FROM stdin;
2	67	3	doctor_alert	URGENT AI Alert: Μαρία Κωνσταντίνου	Patient: Μαρία Κωνσταντίνου | Group: New Setup Monitoring | Priority: medium | Risk Level: critical | AI Score: 95 | Reason: New setup: 20 days	executed	2026-03-28 20:46:07.128192	2026-03-28 20:47:37.107002	demo-tenant	\N	\N	\N	\N	System	2026-04-04 19:52:32.01993+03
1	68	1	doctor_alert	URGENT AI Alert: CPAP Test Patient	Patient: CPAP Test Patient | Group: New Setup Monitoring | Priority: medium | Risk Level: critical | AI Score: 95 | Reason: New setup: 20 days	executed	2026-03-28 20:46:07.115694	2026-03-28 20:47:41.928371	demo-tenant	\N	\N	\N	\N	System	2026-04-04 19:52:32.01993+03
3	67	3	doctor_alert	URGENT AI Alert: Μαρία Κωνσταντίνου	Patient: Μαρία Κωνσταντίνου | Group: New Setup Monitoring | Priority: critical | Risk Level: critical | AI Score: 95 | Reason: New setup: 20 days	pending	2026-03-29 09:17:10.071883	\N	demo-tenant	\N	\N	\N	\N	System	2026-04-04 19:52:32.01993+03
4	68	1	doctor_alert	URGENT AI Alert: CPAP Test Patient	Patient: CPAP Test Patient | Group: New Setup Monitoring | Priority: critical | Risk Level: critical | AI Score: 95 | Reason: New setup: 20 days	executed	2026-03-29 09:17:10.085055	2026-03-29 09:17:56.789061	demo-tenant	\N	\N	\N	\N	System	2026-04-04 19:52:32.01993+03
\.


--
-- Data for Name: atlas_cases; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.atlas_cases (id, tenant_id, patient_id, patient_name, doctor_name, action_group_name, reason, priority, score, revenue_estimate, usage_avg_7d, ahi_avg_7d, assigned_to, status, lane, created_at, updated_at) FROM stdin;
AT-001	demo-tenant	PT-1003	Dimitris Leonidas	Dr. Eleni Perraki	Critical Compliance Drop	Usage below target for 5 days	critical	94	420	2.8	10.9	Operations Admin	open	today	2026-04-04 19:52:32.040898+03	2026-04-04 19:52:32.040898+03
AT-002	demo-tenant	PT-1002	Eleni Kosta	Dr. Nikos Andreou	Callback Requested	Patient requested evening call	high	76	180	4.6	7.8	Follow-up Manager	open	today	2026-04-04 19:52:32.054703+03	2026-04-04 19:52:32.054703+03
AT-003	demo-tenant	PT-1004	Maria Ioannou	Dr. George Dimitriou	Mask Leak Watch	Leak increased for 2 consecutive nights	medium	58	90	7.4	3.4	Operations Admin	monitoring	next	2026-04-04 19:52:32.055878+03	2026-04-04 19:52:32.055878+03
AT-004	demo-tenant	PT-1001	Giorgos Papadakis	Dr. Maria Papadopoulou	Education Follow-up	Review adherence coaching outcome	low	28	55	7.8	2.7	Follow-up Manager	resolved	done	2026-04-04 19:52:32.056801+03	2026-04-04 19:52:32.056801+03
\.


--
-- Data for Name: atlas_tasks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.atlas_tasks (id, tenant_id, case_id, patient_name, title, owner, priority, status, due_at, action_group_name, created_at, updated_at) FROM stdin;
ATT-001	demo-tenant	AT-001	Dimitris Leonidas	Call critical compliance patient	Operations Admin	critical	open	2026-04-04 19:52:32.051+03	Critical Compliance Drop	2026-04-04 19:52:32.057825+03	2026-04-04 19:52:32.057825+03
ATT-002	demo-tenant	AT-002	Eleni Kosta	Schedule requested callback	Follow-up Manager	high	pending	2026-04-05 01:52:32.051+03	Callback Requested	2026-04-04 19:52:32.060081+03	2026-04-04 19:52:32.060081+03
ATT-003	demo-tenant	AT-003	Maria Ioannou	Review leak pattern	Operations Admin	medium	done	2026-04-04 11:52:32.051+03	Mask Leak Watch	2026-04-04 19:52:32.061362+03	2026-04-04 19:52:32.061362+03
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.audit_logs (id, user_id, action, entity, entity_id, created_at) FROM stdin;
\.


--
-- Data for Name: billing_deals; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.billing_deals (id, tenant_id, name, stage, value, probability, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: clinical_notes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.clinical_notes (id, patient_id, doctor_id, note, created_at) FROM stdin;
\.


--
-- Data for Name: compliance; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.compliance (id, patient_id, date, hours_used, ahi, mask_leak, created_at) FROM stdin;
\.


--
-- Data for Name: compliance_entries; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.compliance_entries (id, patient_id, entry_date, hours_used, source, notes, created_at) FROM stdin;
\.


--
-- Data for Name: compliance_periods; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.compliance_periods (id, patient_id, period_start, period_end, target_hours, total_hours, status, updated_at) FROM stdin;
\.


--
-- Data for Name: compliance_summary; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.compliance_summary (id, patient_id, month, year, total_hours, compliance_percentage, status) FROM stdin;
\.


--
-- Data for Name: cpap_devices; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cpap_devices (id, serial_number, model, pressure_setting, setup_date, patient_id, created_at, vendor, external_device_id) FROM stdin;
\.


--
-- Data for Name: device_inventory; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.device_inventory (id, serial_number, brand, model, status, assigned_patient, assigned_date, created_at) FROM stdin;
\.


--
-- Data for Name: devices; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.devices (id, tenant_id, patient_id, serial, usage_7d, usage_avg_7d, leak, mask_leak, status, last_sync, created_at, updated_at) FROM stdin;
devices_1775541561174_l48m3j	demo-tenant	5	\N	0	0	0	0	active	\N	2026-04-07 08:59:21.103+03	2026-04-07 08:59:21.103+03
devices_1775542397042_t32nc6	demo-tenant	5	\N	0	0	0	0	active	\N	2026-04-07 09:13:17.013+03	2026-04-07 09:13:17.013+03
devices_1775542506061_dd7gli	demo-tenant	5	\N	0	0	0	0	active	\N	2026-04-07 09:15:06.032+03	2026-04-07 09:15:06.032+03
devices_1775598278513_e37scn	demo-tenant	5	\N	0	0	0	0	active	\N	2026-04-08 00:44:38.462+03	2026-04-08 00:44:38.462+03
\.


--
-- Data for Name: doctor_subscriptions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.doctor_subscriptions (id, doctor_id, plan_name, status, price_monthly, start_date, end_date, created_at, tenant_id, plan, patient_count, monthly_fee, stripe_customer_id, stripe_subscription_id, current_period_start, current_period_end, last_invoice_at, updated_at, doctor_name, specialty) FROM stdin;
2001	1001	Starter	active	0.00	2026-04-02	\N	2026-04-02 21:18:23.792395	demo-tenant	Starter	120	149	cus_raftop_1001	sub_raftop_1001	2026-03-23 21:18:23.792395+02	2026-04-22 21:18:23.792395+03	2026-03-11 21:18:23.792395+02	2026-04-02 21:18:23.792395+03	\N	\N
2002	1002	Professional	active	0.00	2026-04-02	\N	2026-04-02 21:18:23.792395	demo-tenant	Professional	340	399	cus_raftop_1002	sub_raftop_1002	2026-03-24 21:18:23.792395+02	2026-04-23 21:18:23.792395+03	2026-03-10 21:18:23.792395+02	2026-04-02 21:18:23.792395+03	\N	\N
2003	1003	Professional	trial	0.00	2026-04-02	\N	2026-04-02 21:18:23.792395	demo-tenant	Professional	280	399	cus_raftop_1003	sub_raftop_1003	2026-03-27 21:18:23.792395+02	2026-04-26 21:18:23.792395+03	2026-03-07 21:18:23.792395+02	2026-04-02 21:18:23.792395+03	\N	\N
2004	1004	Enterprise	past_due	0.00	2026-04-02	\N	2026-04-02 21:18:23.792395	demo-tenant	Enterprise	920	999	cus_raftop_1004	sub_raftop_1004	2026-03-18 21:18:23.792395+02	2026-04-17 21:18:23.792395+03	2026-02-28 21:18:23.792395+02	2026-04-02 21:18:23.792395+03	\N	\N
2	doctors_1775542397086_g8r9uj	premium_doctor	active	0.00	2026-04-07	2027-04-07	2026-04-07 06:13:17.013	demo-tenant	Starter	0	0	\N	\N	\N	\N	\N	2026-04-07 09:13:17.013+03	\N	\N
\.


--
-- Data for Name: doctors; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.doctors (id, tenant_id, name, email, created_at, updated_at) FROM stdin;
1001	demo-tenant	Dr. Maria Papadopoulou	maria@example.com	2026-04-02 21:18:23.792395+03	2026-04-02 21:18:23.792395+03
1002	demo-tenant	Dr. Nikos Andreou	nikos@example.com	2026-04-02 21:18:23.792395+03	2026-04-02 21:18:23.792395+03
1003	demo-tenant	Dr. Eleni Perraki	eleni@example.com	2026-04-02 21:18:23.792395+03	2026-04-02 21:18:23.792395+03
1004	demo-tenant	Dr. George Dimitriou	george@example.com	2026-04-02 21:18:23.792395+03	2026-04-02 21:18:23.792395+03
doctors_1775542397086_g8r9uj	demo-tenant	Demo Doctor	doctor@raftop.local	2026-04-07 09:13:17.081+03	2026-04-07 09:13:17.081+03
\.


--
-- Data for Name: followup_reminders; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.followup_reminders (id, patient_id, doctor_id, reminder_date, status, note, created_at) FROM stdin;
\.


--
-- Data for Name: followups; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.followups (id, tenant_id, patient_id, reason, owner, priority, outcome, next_action, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: integrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.integrations (id, tenant_id, name, provider, status, mode, last_sync_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: notes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notes (id, tenant_id, patient_id, author, category, text, note, body, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: notification_queue; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notification_queue (id, patient_id, patient_action_status_id, auto_action_id, channel, recipient, subject, message, status, error_message, created_at, sent_at) FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notifications (id, tenant_id, title, channel, recipient, status, body, message, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: patient_action_status; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.patient_action_status (id, patient_id, device_id, action_group_id, reason, score, priority, status, assigned_to, last_contact_at, next_action_at, no_data_days, usage_avg_3d, usage_avg_7d, ahi_avg_7d, leak_avg_7d, unresolved_days, revenue_potential, is_current, created_at, updated_at, revenue_estimate, ai_score, risk_level) FROM stdin;
1	2	\N	4	New setup: 20 days	10	low	open	\N	\N	\N	0	3.50	4.20	8.00	12.00	0	0.00	f	2026-03-23 23:22:31.79213	2026-03-23 23:23:30.174053	0.00	0	low
2	4	\N	4	New setup: 20 days	10	low	open	\N	\N	\N	0	3.50	4.20	8.00	12.00	0	0.00	f	2026-03-23 23:22:31.79555	2026-03-23 23:23:30.174053	0.00	0	low
3	1	\N	4	New setup: 20 days	10	low	open	\N	\N	\N	0	3.50	4.20	8.00	12.00	0	0.00	f	2026-03-23 23:22:31.79676	2026-03-23 23:23:30.174053	0.00	0	low
4	3	\N	4	New setup: 20 days	10	low	open	\N	\N	\N	0	3.50	4.20	8.00	12.00	0	0.00	f	2026-03-23 23:22:31.798115	2026-03-23 23:23:30.174053	0.00	0	low
22	4	\N	4	New setup: 20 days | Escalated after 2 unresolved days	30	high	open	\N	\N	\N	0	3.50	4.20	8.00	12.00	2	0.00	f	2026-03-24 00:51:08.466432	2026-03-24 01:12:51.928494	60.00	0	low
23	3	\N	4	New setup: 20 days | Escalated after 2 unresolved days	30	high	open	\N	\N	\N	0	3.50	4.20	8.00	12.00	2	0.00	f	2026-03-24 00:51:08.471343	2026-03-24 01:12:51.928494	60.00	0	low
24	1	\N	4	New setup: 20 days | Escalated after 2 unresolved days	30	high	open	\N	\N	\N	0	3.50	4.20	8.00	12.00	2	0.00	f	2026-03-24 00:51:08.474805	2026-03-24 01:12:51.928494	60.00	0	low
21	2	\N	4	New setup: 20 days | Escalated after 2 unresolved days	30	high	open	\N	\N	\N	0	3.50	4.20	8.00	12.00	2	0.00	f	2026-03-24 00:51:08.457644	2026-03-24 01:12:51.928494	60.00	0	low
8	3	\N	4	New setup: 20 days	10	low	open	1	2026-03-24 00:10:39.010922	\N	0	3.50	4.20	8.00	12.00	0	0.00	f	2026-03-23 23:23:30.184278	2026-03-24 00:20:54.631136	0.00	0	low
7	1	\N	4	New setup: 20 days	10	low	open	1	\N	\N	0	3.50	4.20	8.00	12.00	0	0.00	f	2026-03-23 23:23:30.183239	2026-03-24 00:20:54.631136	0.00	0	low
6	4	\N	4	New setup: 20 days	10	low	open	1	\N	\N	0	3.50	4.20	8.00	12.00	0	0.00	f	2026-03-23 23:23:30.182332	2026-03-24 00:20:54.631136	0.00	0	low
5	2	\N	4	New setup: 20 days	10	low	open	1	\N	\N	0	3.50	4.20	8.00	12.00	0	0.00	f	2026-03-23 23:23:30.181028	2026-03-24 00:20:54.631136	0.00	0	low
9	2	\N	4	New setup: 20 days	10	low	open	\N	\N	\N	0	3.50	4.20	8.00	12.00	0	0.00	f	2026-03-24 00:20:54.645121	2026-03-24 00:27:21.306717	0.00	0	low
10	4	\N	4	New setup: 20 days	10	low	open	\N	\N	\N	0	3.50	4.20	8.00	12.00	0	0.00	f	2026-03-24 00:20:54.654553	2026-03-24 00:27:21.306717	0.00	0	low
11	1	\N	4	New setup: 20 days	10	low	open	\N	\N	\N	0	3.50	4.20	8.00	12.00	0	0.00	f	2026-03-24 00:20:54.661874	2026-03-24 00:27:21.306717	0.00	0	low
12	3	\N	4	New setup: 20 days	10	low	open	\N	\N	\N	0	3.50	4.20	8.00	12.00	0	0.00	f	2026-03-24 00:20:54.668382	2026-03-24 00:27:21.306717	0.00	0	low
13	2	\N	4	New setup: 20 days	10	low	open	\N	\N	\N	0	3.50	4.20	8.00	12.00	5	0.00	f	2026-03-24 00:27:21.316123	2026-03-24 00:33:29.831934	0.00	0	low
14	4	\N	4	New setup: 20 days	10	low	open	\N	\N	\N	0	3.50	4.20	8.00	12.00	5	0.00	f	2026-03-24 00:27:21.319899	2026-03-24 00:33:29.831934	0.00	0	low
15	3	\N	4	New setup: 20 days	10	low	open	\N	\N	\N	0	3.50	4.20	8.00	12.00	5	0.00	f	2026-03-24 00:27:21.323105	2026-03-24 00:33:29.831934	0.00	0	low
16	1	\N	4	New setup: 20 days	10	low	open	\N	\N	\N	0	3.50	4.20	8.00	12.00	5	0.00	f	2026-03-24 00:27:21.325933	2026-03-24 00:33:29.831934	0.00	0	low
17	2	\N	4	New setup: 20 days | Escalated after 2 unresolved days	30	high	open	\N	\N	\N	0	3.50	4.20	8.00	12.00	2	0.00	f	2026-03-24 00:33:29.838356	2026-03-24 00:51:08.446122	0.00	0	low
18	4	\N	4	New setup: 20 days | Escalated after 2 unresolved days	30	high	open	\N	\N	\N	0	3.50	4.20	8.00	12.00	2	0.00	f	2026-03-24 00:33:29.841906	2026-03-24 00:51:08.446122	0.00	0	low
19	3	\N	4	New setup: 20 days | Escalated after 2 unresolved days	30	high	open	\N	\N	\N	0	3.50	4.20	8.00	12.00	2	0.00	f	2026-03-24 00:33:29.844247	2026-03-24 00:51:08.446122	0.00	0	low
20	1	\N	4	New setup: 20 days | Escalated after 2 unresolved days	30	high	open	\N	\N	\N	0	3.50	4.20	8.00	12.00	2	0.00	f	2026-03-24 00:33:29.846889	2026-03-24 00:51:08.446122	0.00	0	low
25	2	\N	4	New setup: 20 days | Escalated after 2 unresolved days	30	high	open	\N	\N	\N	0	3.50	4.20	8.00	12.00	2	0.00	f	2026-03-24 01:12:51.932219	2026-03-24 01:22:20.79963	60.00	0	low
26	4	\N	4	New setup: 20 days | Escalated after 2 unresolved days	30	high	open	\N	\N	\N	0	3.50	4.20	8.00	12.00	2	0.00	f	2026-03-24 01:12:51.941074	2026-03-24 01:22:20.79963	60.00	0	low
27	3	\N	4	New setup: 20 days | Escalated after 2 unresolved days	30	high	open	\N	\N	\N	0	3.50	4.20	8.00	12.00	2	0.00	f	2026-03-24 01:12:51.94269	2026-03-24 01:22:20.79963	60.00	0	low
28	1	\N	4	New setup: 20 days | Escalated after 2 unresolved days	30	high	open	\N	\N	\N	0	3.50	4.20	8.00	12.00	2	0.00	f	2026-03-24 01:12:51.944135	2026-03-24 01:22:20.79963	60.00	0	low
29	2	\N	4	New setup: 20 days | Escalated after 2 unresolved days	30	high	open	\N	\N	\N	0	3.50	4.20	8.00	12.00	2	0.00	f	2026-03-24 01:22:20.807023	2026-03-24 18:41:11.897325	60.00	0	low
30	4	\N	4	New setup: 20 days | Escalated after 2 unresolved days	30	high	open	\N	\N	\N	0	3.50	4.20	8.00	12.00	2	0.00	f	2026-03-24 01:22:20.810791	2026-03-24 18:41:11.897325	60.00	0	low
31	3	\N	4	New setup: 20 days | Escalated after 2 unresolved days	30	high	open	\N	\N	\N	0	3.50	4.20	8.00	12.00	2	0.00	f	2026-03-24 01:22:20.813254	2026-03-24 18:41:11.897325	60.00	0	low
32	1	\N	4	New setup: 20 days | Escalated after 2 unresolved days	30	high	open	\N	\N	\N	0	3.50	4.20	8.00	12.00	2	0.00	f	2026-03-24 01:22:20.815406	2026-03-24 18:41:11.897325	60.00	0	low
33	2	\N	4	New setup: 20 days | Escalated after 2 unresolved days	30	high	open	\N	\N	\N	0	3.50	4.20	8.00	12.00	2	0.00	f	2026-03-24 18:41:11.918429	2026-03-25 08:40:03.927359	60.00	0	low
34	4	\N	4	New setup: 20 days | Escalated after 2 unresolved days	30	high	open	\N	\N	\N	0	3.50	4.20	8.00	12.00	2	0.00	f	2026-03-24 18:41:11.950503	2026-03-25 08:40:03.927359	60.00	0	low
35	3	\N	4	New setup: 20 days | Escalated after 2 unresolved days	30	high	open	\N	\N	\N	0	3.50	4.20	8.00	12.00	2	0.00	f	2026-03-24 18:41:11.952229	2026-03-25 08:40:03.927359	60.00	0	low
36	1	\N	4	New setup: 20 days | Escalated after 2 unresolved days	30	high	open	\N	\N	\N	0	3.50	4.20	8.00	12.00	2	0.00	f	2026-03-24 18:41:11.955582	2026-03-25 08:40:03.927359	60.00	0	low
37	2	\N	4	New setup: 20 days | Escalated after 2 unresolved days	30	high	open	\N	\N	\N	0	3.50	4.20	8.00	12.00	2	0.00	f	2026-03-25 08:40:03.946493	2026-03-25 08:40:03.946493	60.00	0	low
38	4	\N	4	New setup: 20 days | Escalated after 2 unresolved days	30	high	open	\N	\N	\N	0	3.50	4.20	8.00	12.00	2	0.00	f	2026-03-25 08:40:03.983592	2026-03-25 08:40:03.983592	60.00	0	low
39	3	\N	4	New setup: 20 days | Escalated after 2 unresolved days	30	high	open	\N	\N	\N	0	3.50	4.20	8.00	12.00	2	0.00	f	2026-03-25 08:40:03.985662	2026-03-25 08:40:03.985662	60.00	0	low
40	1	\N	4	New setup: 20 days | Escalated after 2 unresolved days	30	high	open	\N	\N	\N	0	3.50	4.20	8.00	12.00	2	0.00	f	2026-03-25 08:40:03.987957	2026-03-25 08:40:03.987957	60.00	0	low
41	2	\N	4	New setup: 20 days	30	medium	open	\N	\N	\N	0	3.50	4.20	8.00	12.00	2	0.00	f	2026-03-25 22:23:26.868063	2026-03-25 22:23:26.868063	50.00	0	low
42	4	\N	4	New setup: 20 days	30	medium	open	\N	\N	\N	0	3.50	4.20	8.00	12.00	2	0.00	f	2026-03-25 22:23:26.879326	2026-03-25 22:23:26.879326	50.00	0	low
43	3	\N	4	New setup: 20 days	30	medium	open	\N	\N	\N	0	3.50	4.20	8.00	12.00	2	0.00	f	2026-03-25 22:23:26.880888	2026-03-25 22:23:26.880888	50.00	0	low
44	1	\N	4	New setup: 20 days	30	medium	open	\N	\N	\N	0	3.50	4.20	8.00	12.00	2	0.00	f	2026-03-25 22:23:26.882476	2026-03-25 22:23:26.882476	50.00	0	low
45	2	\N	4	New setup: 20 days	30	medium	open	\N	\N	\N	0	3.50	4.20	8.00	12.00	2	0.00	f	2026-03-25 22:23:49.636378	2026-03-25 22:23:49.636378	50.00	0	low
46	4	\N	4	New setup: 20 days	30	medium	open	\N	\N	\N	0	3.50	4.20	8.00	12.00	2	0.00	f	2026-03-25 22:23:49.638447	2026-03-25 22:23:49.638447	50.00	0	low
47	3	\N	4	New setup: 20 days	30	medium	open	\N	\N	\N	0	3.50	4.20	8.00	12.00	2	0.00	f	2026-03-25 22:23:49.641747	2026-03-25 22:23:49.641747	50.00	0	low
48	1	\N	4	New setup: 20 days	30	medium	open	\N	\N	\N	0	3.50	4.20	8.00	12.00	2	0.00	f	2026-03-25 22:23:49.644527	2026-03-25 22:23:49.644527	50.00	0	low
49	2	\N	4	New setup: 20 days	30	medium	open	\N	\N	\N	0	3.50	4.20	8.00	12.00	2	0.00	f	2026-03-25 22:31:49.876819	2026-03-25 22:31:49.876819	50.00	0	low
50	4	\N	4	New setup: 20 days	30	medium	open	\N	\N	\N	0	3.50	4.20	8.00	12.00	2	0.00	f	2026-03-25 22:31:49.880032	2026-03-25 22:31:49.880032	50.00	0	low
51	3	\N	4	New setup: 20 days	30	medium	open	\N	\N	\N	0	3.50	4.20	8.00	12.00	2	0.00	f	2026-03-25 22:31:49.881823	2026-03-25 22:31:49.881823	50.00	0	low
52	1	\N	4	New setup: 20 days	30	medium	open	\N	\N	\N	0	3.50	4.20	8.00	12.00	2	0.00	f	2026-03-25 22:31:49.883377	2026-03-25 22:31:49.883377	50.00	0	low
69	2	\N	4	New setup: 20 days	30	medium	open	\N	\N	\N	0	3.50	4.20	8.00	12.00	2	0.00	f	2026-03-29 10:40:35.186493	2026-03-29 10:40:35.186493	50.00	0	low
70	4	\N	4	New setup: 20 days	30	medium	open	\N	\N	\N	0	3.50	4.20	8.00	12.00	2	0.00	f	2026-03-29 10:40:35.204789	2026-03-29 10:40:35.204789	50.00	0	low
71	3	\N	4	New setup: 20 days	30	medium	open	\N	\N	\N	0	3.50	4.20	8.00	12.00	2	0.00	f	2026-03-29 10:40:35.20615	2026-03-29 10:40:35.20615	50.00	0	low
72	1	\N	4	New setup: 20 days	30	medium	open	\N	\N	\N	0	3.50	4.20	8.00	12.00	2	0.00	f	2026-03-29 10:40:35.207611	2026-03-29 10:40:35.207611	50.00	0	low
61	2	\N	4	New setup: 20 days	30	medium	open	\N	\N	\N	0	3.50	4.20	8.00	12.00	2	0.00	f	2026-03-25 23:41:12.859337	2026-03-25 23:41:12.859337	50.00	23	low
62	4	\N	4	New setup: 20 days	30	medium	open	\N	\N	\N	0	3.50	4.20	8.00	12.00	2	0.00	f	2026-03-25 23:41:12.866332	2026-03-25 23:41:12.866332	50.00	23	low
63	3	\N	4	New setup: 20 days	30	medium	open	\N	\N	\N	0	3.50	4.20	8.00	12.00	2	0.00	f	2026-03-25 23:41:12.869508	2026-03-25 23:41:12.869508	50.00	23	low
64	1	\N	4	New setup: 20 days	30	medium	open	\N	\N	\N	0	3.50	4.20	8.00	12.00	2	0.00	f	2026-03-25 23:41:12.87111	2026-03-25 23:41:12.87111	50.00	23	low
81	2	\N	4	New setup: 20 days	30	medium	open	\N	\N	\N	0	3.50	4.20	8.00	12.00	2	0.00	f	2026-03-29 18:30:22.635259	2026-03-29 18:30:22.635259	50.00	0	low
60	1	\N	4	New setup: 20 days	30	medium	open	\N	\N	\N	0	3.50	4.20	8.00	12.00	2	0.00	f	2026-03-25 22:57:14.314018	2026-03-25 22:57:14.314018	50.00	23	low
57	2	\N	4	New setup: 20 days	30	medium	open	\N	\N	\N	0	3.50	4.20	8.00	12.00	2	0.00	f	2026-03-25 22:57:14.30646	2026-03-25 22:57:14.30646	50.00	23	low
58	4	\N	4	New setup: 20 days	30	medium	open	\N	\N	\N	0	3.50	4.20	8.00	12.00	2	0.00	f	2026-03-25 22:57:14.309937	2026-03-25 22:57:14.309937	50.00	23	low
53	2	\N	4	New setup: 20 days	30	medium	open	\N	\N	\N	0	3.50	4.20	8.00	12.00	2	0.00	f	2026-03-25 22:34:12.432926	2026-03-25 22:34:12.432926	50.00	23	low
54	4	\N	4	New setup: 20 days	30	medium	open	\N	\N	\N	0	3.50	4.20	8.00	12.00	2	0.00	f	2026-03-25 22:34:12.435603	2026-03-25 22:34:12.435603	50.00	23	low
55	3	\N	4	New setup: 20 days	30	medium	open	\N	\N	\N	0	3.50	4.20	8.00	12.00	2	0.00	f	2026-03-25 22:34:12.437497	2026-03-25 22:34:12.437497	50.00	23	low
56	1	\N	4	New setup: 20 days	30	medium	open	\N	\N	\N	0	3.50	4.20	8.00	12.00	2	0.00	f	2026-03-25 22:34:12.44066	2026-03-25 22:34:12.44066	50.00	23	low
82	4	\N	4	New setup: 20 days	30	medium	open	\N	\N	\N	0	3.50	4.20	8.00	12.00	2	0.00	f	2026-03-29 18:30:22.637076	2026-03-29 18:30:22.637076	50.00	0	low
76	1	\N	4	New setup: 20 days	30	medium	resolved	\N	\N	\N	0	3.50	4.20	8.00	12.00	2	0.00	f	2026-03-29 13:36:32.939744	2026-03-29 14:08:14.740516	50.00	0	low
75	3	\N	4	New setup: 20 days	30	medium	resolved	\N	\N	\N	0	3.50	4.20	8.00	12.00	2	0.00	f	2026-03-29 13:36:32.938337	2026-03-29 14:08:16.549739	50.00	0	low
59	3	\N	4	New setup: 20 days	30	medium	open	\N	\N	\N	0	3.50	4.20	8.00	12.00	2	0.00	f	2026-03-25 22:57:14.31203	2026-03-25 22:57:14.31203	50.00	23	low
73	2	\N	4	New setup: 20 days	30	medium	open	\N	\N	\N	0	3.50	4.20	8.00	12.00	2	0.00	f	2026-03-29 13:36:32.916754	2026-03-29 13:36:32.916754	50.00	0	low
74	4	\N	4	New setup: 20 days	30	medium	open	\N	\N	\N	0	3.50	4.20	8.00	12.00	2	0.00	f	2026-03-29 13:36:32.937029	2026-03-29 13:36:32.937029	50.00	0	low
67	3	\N	4	New setup: 20 days	30	critical	resolved	1	2026-03-29 10:05:09.693642	\N	0	3.50	4.20	8.00	12.00	2	0.00	f	2026-03-25 23:48:43.623632	2026-03-29 10:05:14.968777	50.00	23	low
65	2	\N	4	New setup: 20 days	30	medium	open	\N	\N	\N	0	3.50	4.20	8.00	12.00	2	0.00	f	2026-03-25 23:48:43.619728	2026-03-25 23:48:43.619728	50.00	23	low
66	4	\N	4	New setup: 20 days	30	medium	open	\N	\N	\N	0	3.50	4.20	8.00	12.00	2	0.00	f	2026-03-25 23:48:43.622486	2026-03-25 23:48:43.622486	50.00	23	low
68	1	\N	4	New setup: 20 days	30	critical	open	\N	\N	\N	0	3.50	4.20	8.00	12.00	2	0.00	f	2026-03-25 23:48:43.624704	2026-03-29 09:14:03.499122	50.00	23	low
77	2	\N	4	New setup: 20 days	30	medium	open	\N	\N	\N	0	3.50	4.20	8.00	12.00	2	0.00	f	2026-03-29 18:30:00.763384	2026-03-29 18:30:00.763384	50.00	0	low
78	4	\N	4	New setup: 20 days	30	medium	open	\N	\N	\N	0	3.50	4.20	8.00	12.00	2	0.00	f	2026-03-29 18:30:00.773201	2026-03-29 18:30:00.773201	50.00	0	low
79	3	\N	4	New setup: 20 days	30	medium	open	\N	\N	\N	0	3.50	4.20	8.00	12.00	2	0.00	f	2026-03-29 18:30:00.774652	2026-03-29 18:30:00.774652	50.00	0	low
80	1	\N	4	New setup: 20 days	30	medium	open	\N	\N	\N	0	3.50	4.20	8.00	12.00	2	0.00	f	2026-03-29 18:30:00.777578	2026-03-29 18:30:00.777578	50.00	0	low
83	3	\N	4	New setup: 20 days	30	medium	open	\N	\N	\N	0	3.50	4.20	8.00	12.00	2	0.00	f	2026-03-29 18:30:22.638334	2026-03-29 18:30:22.638334	50.00	0	low
84	1	\N	4	New setup: 20 days	30	medium	open	\N	\N	\N	0	3.50	4.20	8.00	12.00	2	0.00	f	2026-03-29 18:30:22.64394	2026-03-29 18:30:22.64394	50.00	0	low
85	2	\N	4	New setup: 20 days	30	medium	open	\N	\N	\N	0	3.50	4.20	8.00	12.00	2	0.00	f	2026-03-29 21:24:59.584302	2026-03-29 21:24:59.584302	50.00	0	low
86	4	\N	4	New setup: 20 days	30	medium	open	\N	\N	\N	0	3.50	4.20	8.00	12.00	2	0.00	f	2026-03-29 21:24:59.606603	2026-03-29 21:24:59.606603	50.00	0	low
87	3	\N	4	New setup: 20 days	30	medium	open	\N	\N	\N	0	3.50	4.20	8.00	12.00	2	0.00	f	2026-03-29 21:24:59.609172	2026-03-29 21:24:59.609172	50.00	0	low
88	1	\N	4	New setup: 20 days	30	medium	open	\N	\N	\N	0	3.50	4.20	8.00	12.00	2	0.00	f	2026-03-29 21:24:59.611538	2026-03-29 21:24:59.611538	50.00	0	low
89	2	\N	4	New setup: 20 days	30	medium	open	\N	\N	\N	0	3.50	4.20	8.00	12.00	2	0.00	t	2026-03-30 00:23:47.01897	2026-03-30 00:23:47.01897	50.00	0	low
90	4	\N	4	New setup: 20 days	30	medium	open	\N	\N	\N	0	3.50	4.20	8.00	12.00	2	0.00	t	2026-03-30 00:23:47.032401	2026-03-30 00:23:47.032401	50.00	0	low
91	3	\N	4	New setup: 20 days	30	medium	open	\N	\N	\N	0	3.50	4.20	8.00	12.00	2	0.00	t	2026-03-30 00:23:47.034856	2026-03-30 00:23:47.034856	50.00	0	low
92	1	\N	4	New setup: 20 days	30	medium	open	\N	\N	\N	0	3.50	4.20	8.00	12.00	2	0.00	t	2026-03-30 00:23:47.037865	2026-03-30 00:23:47.037865	50.00	0	low
\.


--
-- Data for Name: patient_activation_codes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.patient_activation_codes (id, patient_id, activation_code, plan_name, price_yearly, status, created_at) FROM stdin;
1	\N	CPAP-DVPX-6656	\N	\N	unused	2026-03-07 17:41:54.589119
\.


--
-- Data for Name: patient_events; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.patient_events (id, patient_id, event_type, notes, created_at) FROM stdin;
\.


--
-- Data for Name: patient_metrics; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.patient_metrics (id, patient_id, usage_avg_3d, usage_avg_7d, ahi_avg_7d, leak_avg_7d, no_data_days, days_since_setup, unresolved_days, accessory_renewal_due_days, created_at, updated_at) FROM stdin;
1	2	3.50	4.20	8.00	12.00	0	20	2	30	2026-03-23 22:11:07.019503	2026-03-23 22:11:07.019503
2	4	3.50	4.20	8.00	12.00	0	20	2	30	2026-03-23 22:11:07.019503	2026-03-23 22:11:07.019503
4	3	3.50	4.20	8.00	12.00	0	20	2	30	2026-03-23 22:11:07.019503	2026-03-23 22:11:07.019503
3	1	3.50	4.20	8.00	12.00	0	20	2	30	2026-03-23 22:11:07.019503	2026-03-23 22:11:07.019503
\.


--
-- Data for Name: patient_subscriptions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.patient_subscriptions (id, patient_id, plan_name, price_yearly, start_date, end_date, status, created_at) FROM stdin;
\.


--
-- Data for Name: patients; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.patients (id, name, age, diagnosis, phone, cpap_hours, compliance_status, created_at, device_serial, doctor_id, email, password, risk_score, risk_level, tenant_id) FROM stdin;
2	Γεώργιος Παπαδόπουλος	52	Sleep Apnea	6900000001	5	good	2026-02-17 01:27:27.656417	\N	\N	\N	\N	0	LOW	demo-tenant
3	Μαρία Κωνσταντίνου	47	OSA Severe	6900000002	3	medium	2026-02-17 01:27:27.656417	\N	\N	\N	\N	0	LOW	demo-tenant
4	Νίκος Δημητρίου	60	OSA Moderate	6900000003	2	low	2026-02-17 01:27:27.656417	\N	\N	\N	\N	0	LOW	demo-tenant
1	CPAP Test Patient	58	Obstructive Sleep Apnea	6900000000	7	critical	2026-02-14 21:45:36.008845	\N	\N	\N	\N	0	LOW	demo-tenant
5	patients 1775541561163	\N	\N	6900000001	0	pending	2026-04-07 05:59:21.103	\N	15	patient1@raftop.local	\N	0	LOW	demo-tenant
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payments (id, tenant_id, doctor_id, customer_name, customer_email, order_type, payment_method, amount, currency, status, provider, provider_order_id, provider_payment_id, provider_client_secret, bank_reference, proof_url, notes, description, metadata, created_at, updated_at, paid_at) FROM stdin;
1	demo-tenant	1001	Dr. Maria Papadopoulou	maria@example.com	doctor_subscription	bank_transfer	149	EUR	pending_verification	manual	\N	\N	\N	RAFTOP-1775310502687-36DK0Z	\N	Created from tenant checkout	RAFTOP doctor subscription payment	{}	2026-04-04 16:48:22.705692+03	2026-04-04 16:48:22.705692+03	\N
2	demo-tenant	15	\N	\N	doctor_subscription	payment_method_1775542397098	500	EUR	paid	\N	\N	\N	\N	\N	\N	\N	\N	{}	2026-04-07 09:13:17.013+03	2026-04-07 09:13:17.013+03	2026-04-07 09:13:17.013+03
3	demo-tenant	15	\N	\N	doctor_subscription	payment_method_1775542506098	500	EUR	paid	\N	\N	\N	\N	\N	\N	\N	\N	{}	2026-04-07 09:15:06.032+03	2026-04-07 09:15:06.032+03	2026-04-07 09:15:06.032+03
4	demo-tenant	15	\N	\N	doctor_subscription	payment_method_1775598278575	500	EUR	paid	\N	\N	\N	\N	\N	\N	\N	\N	{}	2026-04-08 00:44:38.462+03	2026-04-08 00:44:38.462+03	2026-04-08 00:44:38.462+03
\.


--
-- Data for Name: referrals; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.referrals (id, tenant_id, patient_name, ref_doctor, specialty, stage, source, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: subscriptions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.subscriptions (id, doctor_id, plan_name, price_yearly, billing_cycle, status, start_date, end_date, auto_renew, notes, created_at) FROM stdin;
\.


--
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tasks (id, patient_id, action_group_id, title, description, status, priority, assigned_to, due_date, sla_status, created_at, completed_at, tenant_id) FROM stdin;
1	4	66	New setup follow-up	[New Setup Monitoring] New setup: 20 days	completed	medium	\N	2026-03-30 20:41:53.295997	completed	2026-03-28 20:41:53.295997	2026-03-28 20:50:46.934703	demo-tenant
2	2	65	New setup follow-up	[New Setup Monitoring] New setup: 20 days	completed	medium	\N	2026-03-30 20:41:53.31143	completed	2026-03-28 20:41:53.31143	2026-03-28 20:50:48.621411	demo-tenant
3	1	68	New setup follow-up	[New Setup Monitoring] New setup: 20 days	completed	medium	\N	2026-03-30 20:41:53.313072	completed	2026-03-28 20:41:53.313072	2026-03-28 20:50:49.355211	demo-tenant
4	3	67	New setup follow-up	[New Setup Monitoring] New setup: 20 days	completed	medium	\N	2026-03-30 20:41:53.314298	completed	2026-03-28 20:41:53.314298	2026-03-28 20:50:49.988495	demo-tenant
6	1	68	URGENT AI Alert: CPAP Test Patient	Patient: CPAP Test Patient | Group: New Setup Monitoring | Priority: medium | Risk Level: critical | AI Score: 95 | Reason: New setup: 20 days	completed	critical	\N	2026-03-29 00:47:41.921817	completed	2026-03-28 20:47:41.921817	2026-03-28 20:50:50.458673	demo-tenant
5	3	67	URGENT AI Alert: Μαρία Κωνσταντίνου	Patient: Μαρία Κωνσταντίνου | Group: New Setup Monitoring | Priority: medium | Risk Level: critical | AI Score: 95 | Reason: New setup: 20 days	completed	critical	\N	2026-03-29 00:47:37.090784	completed	2026-03-28 20:47:37.090784	2026-03-28 20:50:50.931761	demo-tenant
7	1	68	URGENT AI Alert: CPAP Test Patient	Patient: CPAP Test Patient | Group: New Setup Monitoring | Priority: critical | Risk Level: critical | AI Score: 95 | Reason: New setup: 20 days	open	critical	\N	2026-03-29 13:17:56.772537	on_time	2026-03-29 09:17:56.772537	\N	demo-tenant
8	3	67	ATLAS follow-up: Μαρία Κωνσταντίνου	[New Setup Monitoring] New setup: 20 days	open	critical	\N	2026-03-30 10:05:11.637272	on_time	2026-03-29 10:05:11.637272	\N	demo-tenant
\.


--
-- Data for Name: tenant_branding; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tenant_branding (tenant_id, company_name, logo_url, primary_color, secondary_color, accent_color, white_label, custom_domain, support_email, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: tenant_features; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tenant_features (id, tenant_id, key, name, enabled, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: tenant_modules; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tenant_modules (id, tenant_id, key, name, enabled, required_plan, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: tenant_payments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tenant_payments (id, tenant_id, doctor_id, customer_name, customer_email, description, amount, currency, payment_method, status, provider_order_id, bank_reference, notes, created_at, updated_at) FROM stdin;
PAY-1001	demo-tenant	1001	Dr. Maria Papadopoulou	maria@example.com	RAFTOP doctor subscription payment	149	EUR	card	paid	pi_demo_1001			2026-04-04 22:10:26.955564+03	2026-04-04 22:10:26.955564+03
PAY-1002	demo-tenant	1002	Dr. Nikos Andreou	nikos@example.com	RAFTOP doctor subscription payment	199	EUR	paypal	paid	pp_demo_1002			2026-04-04 22:10:26.958787+03	2026-04-04 22:10:26.958787+03
PAY-1004	demo-tenant	1004	Dr. George Dimitriou	george@example.com	RAFTOP starter doctor subscription	99	EUR	cash	verified			Cash expected at office	2026-04-04 22:10:26.9602+03	2026-04-05 11:03:33.312931+03
PAY-1003	demo-tenant	1003	Dr. Eleni Perraki	eleni@example.com	RAFTOP enterprise doctor subscription	248	EUR	bank_transfer	verified		RF-BANK-1003	Pending bank confirmation	2026-04-04 22:10:26.959637+03	2026-04-05 11:03:34.44691+03
\.


--
-- Data for Name: tenant_workspace_branding; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tenant_workspace_branding (tenant_id, company_name, logo_url, primary_color, secondary_color, accent_color, white_label, custom_domain, support_email, updated_at) FROM stdin;
demo-tenant	RAFTOP Enterprise		#2563eb	#0f172a	#10b981	t	enterprise.raftop.local	support@raftop.local	2026-04-04 21:37:23.274387+03
\.


--
-- Data for Name: tenant_workspace_devices; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tenant_workspace_devices (id, tenant_id, serial, patient_name, doctor_name, last_sync, usage_7d, leak, status, created_at) FROM stdin;
DV-1001	demo-tenant	RM-22341	Giorgos Papadakis	Dr. Maria Papadopoulou	2026-03-31 08:55	7.2	8	online	2026-04-04 21:37:23.216737+03
DV-1002	demo-tenant	RM-22342	Eleni Kosta	Dr. Nikos Andreou	2026-03-29 12:20	4.8	18	warning	2026-04-04 21:37:23.219105+03
DV-1003	demo-tenant	RM-22343	Dimitris Leonidas	Dr. Eleni Perraki	2026-03-24 09:10	3.1	26	offline	2026-04-04 21:37:23.220019+03
DV-1004	demo-tenant	RM-22344	Maria Ioannou	Dr. George Dimitriou	2026-03-31 09:02	8	6	online	2026-04-04 21:37:23.22081+03
\.


--
-- Data for Name: tenant_workspace_followups; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tenant_workspace_followups (id, tenant_id, patient_name, reason, owner, priority, outcome, next_action, created_at) FROM stdin;
FU-001	demo-tenant	Eleni Kosta	Below 80h compliance	Follow-up Manager	high	Callback requested	Call tomorrow 10:00	2026-04-04 21:37:23.22178+03
FU-002	demo-tenant	Dimitris Leonidas	Critical usage drop	Operations Admin	critical	No answer	Escalate to doctor	2026-04-04 21:37:23.223827+03
FU-003	demo-tenant	Giorgos Papadakis	Education follow-up	Follow-up Manager	normal	Reached	Close if stable next week	2026-04-04 21:37:23.224694+03
FU-004	demo-tenant	Maria Ioannou	Mask leak review	Operations Admin	high	Promised improvement	Recheck in 3 days	2026-04-04 21:37:23.225489+03
\.


--
-- Data for Name: tenant_workspace_integrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tenant_workspace_integrations (id, tenant_id, name, provider, status, mode, last_sync, created_at) FROM stdin;
INT-001	demo-tenant	ResMed AirView	ResMed	connected	csv-sync	2026-04-02 08:40	2026-04-04 21:37:23.267301+03
INT-002	demo-tenant	Stripe Billing	Stripe	ready	api	2026-04-01 16:20	2026-04-04 21:37:23.270782+03
INT-003	demo-tenant	Email Notifications	SMTP	connected	smtp	2026-04-02 09:10	2026-04-04 21:37:23.272732+03
INT-004	demo-tenant	SMS Gateway	Twilio	pending	api	—	2026-04-04 21:37:23.273649+03
\.


--
-- Data for Name: tenant_workspace_modules; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tenant_workspace_modules (id, tenant_id, module_key, name, enabled, required_plan, status, created_at) FROM stdin;
MOD-001	demo-tenant	dashboard	Dashboard	t	starter	active	2026-04-04 21:37:23.257494+03
MOD-002	demo-tenant	atlas	ATLAS System	t	professional	active	2026-04-04 21:37:23.259968+03
MOD-003	demo-tenant	predictive_ai	Predictive AI	t	professional	active	2026-04-04 21:37:23.260933+03
MOD-004	demo-tenant	doctor_billing	Doctor Billing	t	enterprise	active	2026-04-04 21:37:23.261786+03
MOD-005	demo-tenant	white_label	White Label	f	enterprise	locked	2026-04-04 21:37:23.262538+03
\.


--
-- Data for Name: tenant_workspace_notes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tenant_workspace_notes (id, tenant_id, patient_name, author, category, created_label, note_text, created_at) FROM stdin;
NT-001	demo-tenant	Eleni Kosta	Follow-up Manager	followup	2026-03-31 09:10	Patient requested callback after 18:00 λόγω εργασίας. Αναφέρει δυσφορία με τη μάσκα και χαμηλή διάρκεια χρήσης τις τελευταίες 4 νύχτες.	2026-04-04 21:37:23.231472+03
NT-002	demo-tenant	Dimitris Leonidas	Operations Admin	critical	2026-03-31 08:45	Σημαντική πτώση συμμόρφωσης και επαναλαμβανόμενο no-answer. Προτείνεται ιατρική ειδοποίηση και δεύτερη προσπάθεια επικοινωνίας σήμερα.	2026-04-04 21:37:23.236509+03
NT-003	demo-tenant	Maria Ioannou	Operations Admin	device	2026-03-30 17:20	Παρατηρήθηκε αυξημένο leak για δύο συνεχόμενες νύχτες. Έγινε σύσταση για επανέλεγχο μάσκας και σωστής εφαρμογής.	2026-04-04 21:37:23.2377+03
NT-004	demo-tenant	Giorgos Papadakis	Follow-up Manager	stable	2026-03-30 13:10	Καλή συνολική εικόνα, συμμόρφωση πάνω από στόχο και σταθερή χρήση. Παραμένει σε passive monitoring.	2026-04-04 21:37:23.23888+03
\.


--
-- Data for Name: tenant_workspace_notifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tenant_workspace_notifications (id, tenant_id, title, channel, recipient, status, body, created_label, created_at) FROM stdin;
NF-001	demo-tenant	Critical patient non-compliance	internal	Operations Admin	pending	Patient Dimitris Leonidas dropped below threshold. Recommend immediate call and doctor escalation.	2026-03-31 09:02	2026-04-04 21:37:23.245716+03
NF-002	demo-tenant	Device offline alert	email	Follow-up Manager	sent	Device RM-22343 has not synced for 6 days. Review connectivity and patient usage barriers.	2026-03-31 08:30	2026-04-04 21:37:23.25019+03
NF-003	demo-tenant	Doctor trial conversion reminder	email	Billing Viewer	queued	Upcoming trial expiration for high-usage doctor account. Commercial follow-up suggested.	2026-03-30 17:40	2026-04-04 21:37:23.251552+03
NF-004	demo-tenant	Follow-up callback reminder	sms	Patient Outreach	failed	Callback reminder was not delivered successfully. Retry via alternate route.	2026-03-30 15:12	2026-04-04 21:37:23.252477+03
\.


--
-- Data for Name: tenant_workspace_patients; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tenant_workspace_patients (id, tenant_id, full_name, doctor_name, serial, compliance_hours, ahi, status, created_at) FROM stdin;
PT-1001	demo-tenant	Giorgos Papadakis	Dr. Maria Papadopoulou	RM-22341	92	3.1	stable	2026-04-04 21:37:23.207909+03
PT-1002	demo-tenant	Eleni Kosta	Dr. Nikos Andreou	RM-22342	61	8.4	warning	2026-04-04 21:37:23.210804+03
PT-1003	demo-tenant	Dimitris Leonidas	Dr. Eleni Perraki	RM-22343	44	11.2	critical	2026-04-04 21:37:23.212241+03
PT-1004	demo-tenant	Maria Ioannou	Dr. George Dimitriou	RM-22344	108	2.8	stable	2026-04-04 21:37:23.213134+03
\.


--
-- Data for Name: tenant_workspace_referrals; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tenant_workspace_referrals (id, tenant_id, patient_name, ref_doctor, specialty, stage, source, created_label, created_at) FROM stdin;
RF-001	demo-tenant	Alexandros Vrettos	Dr. Maria Papadopoulou	Pulmonology	new	Clinic	2026-03-31	2026-04-04 21:37:23.239791+03
RF-002	demo-tenant	Katerina Meli	Dr. Nikos Andreou	Cardiology	contacted	Private Practice	2026-03-30	2026-04-04 21:37:23.242397+03
RF-003	demo-tenant	Giannis Laskaris	Dr. Eleni Perraki	Pulmonology	scheduled	Hospital	2026-03-29	2026-04-04 21:37:23.243612+03
RF-004	demo-tenant	Sofia Dima	Dr. George Dimitriou	ENT	converted	Clinic	2026-03-28	2026-04-04 21:37:23.244554+03
\.


--
-- Data for Name: tenant_workspace_tasks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tenant_workspace_tasks (id, tenant_id, title, owner, due, sla, status, created_at) FROM stdin;
TSK-001	demo-tenant	Call Dimitris Leonidas	Operations Admin	2026-03-31 11:30	overdue	open	2026-04-04 21:37:23.226316+03
TSK-002	demo-tenant	Review mask leak for Maria Ioannou	Follow-up Manager	2026-03-31 15:00	today	open	2026-04-04 21:37:23.228292+03
TSK-003	demo-tenant	Send billing reminder	Billing Viewer	2026-04-01 10:00	scheduled	pending	2026-04-04 21:37:23.22918+03
TSK-004	demo-tenant	Doctor callback summary	Operations Admin	2026-03-30 17:00	closed	done	2026-04-04 21:37:23.230158+03
\.


--
-- Data for Name: tenant_workspace_users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tenant_workspace_users (id, tenant_id, name, email, role, status, last_active, created_at) FROM stdin;
USR-001	demo-tenant	RAFTOP Owner	owner@raftop.local	owner	active	2026-04-02 10:15	2026-04-04 21:37:23.253082+03
USR-002	demo-tenant	Operations Admin	ops@raftop.local	admin	active	2026-04-02 09:50	2026-04-04 21:37:23.254484+03
USR-003	demo-tenant	Follow-up Manager	followup@raftop.local	manager	active	2026-04-01 18:35	2026-04-04 21:37:23.25498+03
USR-004	demo-tenant	Billing Viewer	billing@raftop.local	viewer	invited	—	2026-04-04 21:37:23.255711+03
\.


--
-- Data for Name: tenants; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tenants (id, name, plan, status, created_at, updated_at) FROM stdin;
demo-tenant	RAFTOP Demo Tenant	enterprise	active	2026-04-02 20:33:09.592672+03	2026-04-02 20:33:09.592672+03
\.


--
-- Data for Name: usage_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.usage_logs (id, patient_id, usage_date, hours_used, source, created_at, device_serial, import_batch_id, hours, ahi, leak, pressure, vendor, external_patient_id, raw_payload) FROM stdin;
1	1	2026-02-18	6.50	resmed_csv	2026-02-18 17:44:30.951454	ABC123	2ed5d1e6e49669ee96782223	\N	\N	\N	\N	\N	\N	\N
5	1	2026-03-06	2.50	cpap	2026-03-07 00:03:48.340038	\N	\N	\N	\N	\N	\N	\N	\N	\N
6	1	2026-03-05	1.80	cpap	2026-03-07 00:03:48.340038	\N	\N	\N	\N	\N	\N	\N	\N	\N
7	1	2026-03-04	2.20	cpap	2026-03-07 00:03:48.340038	\N	\N	\N	\N	\N	\N	\N	\N	\N
8	2	2026-03-06	6.00	cpap	2026-03-07 00:03:48.340038	\N	\N	\N	\N	\N	\N	\N	\N	\N
9	2	2026-03-05	5.50	cpap	2026-03-07 00:03:48.340038	\N	\N	\N	\N	\N	\N	\N	\N	\N
10	3	2026-03-06	0.80	cpap	2026-03-07 00:03:48.340038	\N	\N	\N	\N	\N	\N	\N	\N	\N
11	3	2026-03-05	1.20	cpap	2026-03-07 00:03:48.340038	\N	\N	\N	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, username, password, role, created_at, name, email, subdomain, clinic_name, logo_url, account_status, clinic_id, tenant_id) FROM stdin;
8	dimitrioskou	$2b$10$g03TXkr.sRo9G/3BY.TMXuLRKWc4Zhf8LBl7qZG5i8m/Xw8scMqb6	admin	2026-02-12 14:33:24.860789	\N	\N	\N	\N	\N	active	\N	demo-tenant
7	admin	$2b$10$/PrWNuuXEldWJ/BZvrDj2eaLgXN8hiYX58BwI5vXkImQ.135Tnd3m	admin	2026-02-09 21:31:44.882701	\N	\N	\N	\N	\N	active	\N	demo-tenant
12	doctor	123456	doctor	2026-02-27 02:17:32.903889	Dr Perraki Eleni	doctor@sleepstudy.gr	\N	\N	\N	active	\N	demo-tenant
14	username_1775541561144	Raftop123!	admin	2026-04-07 05:59:21.103	RAFTOP Admin	admin@raftop.local	\N	\N	\N	active	\N	demo-tenant
15	username_1775541561156	Raftop123!	doctor	2026-04-07 05:59:21.103	Demo Doctor	doctor@raftop.local	\N	\N	\N	active	\N	demo-tenant
\.


--
-- Name: action_group_events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.action_group_events_id_seq', 49, true);


--
-- Name: action_groups_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.action_groups_id_seq', 30, true);


--
-- Name: alerts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.alerts_id_seq', 1, false);


--
-- Name: atlas_auto_actions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.atlas_auto_actions_id_seq', 4, true);


--
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.audit_logs_id_seq', 1, false);


--
-- Name: clinical_notes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.clinical_notes_id_seq', 1, false);


--
-- Name: compliance_entries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.compliance_entries_id_seq', 1, false);


--
-- Name: compliance_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.compliance_id_seq', 1, false);


--
-- Name: compliance_periods_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.compliance_periods_id_seq', 1, false);


--
-- Name: compliance_summary_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.compliance_summary_id_seq', 1, false);


--
-- Name: cpap_devices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.cpap_devices_id_seq', 1, false);


--
-- Name: device_inventory_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.device_inventory_id_seq', 1, false);


--
-- Name: doctor_subscriptions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.doctor_subscriptions_id_seq', 2, true);


--
-- Name: followup_reminders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.followup_reminders_id_seq', 1, false);


--
-- Name: notification_queue_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.notification_queue_id_seq', 1, false);


--
-- Name: patient_action_status_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.patient_action_status_id_seq', 92, true);


--
-- Name: patient_activation_codes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.patient_activation_codes_id_seq', 3, true);


--
-- Name: patient_events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.patient_events_id_seq', 1, false);


--
-- Name: patient_metrics_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.patient_metrics_id_seq', 4, true);


--
-- Name: patient_subscriptions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.patient_subscriptions_id_seq', 1, false);


--
-- Name: patients_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.patients_id_seq', 5, true);


--
-- Name: payments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.payments_id_seq', 4, true);


--
-- Name: subscriptions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.subscriptions_id_seq', 1, true);


--
-- Name: tasks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.tasks_id_seq', 8, true);


--
-- Name: usage_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.usage_logs_id_seq', 11, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 15, true);


--
-- Name: action_group_events action_group_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.action_group_events
    ADD CONSTRAINT action_group_events_pkey PRIMARY KEY (id);


--
-- Name: action_groups action_groups_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.action_groups
    ADD CONSTRAINT action_groups_code_key UNIQUE (code);


--
-- Name: action_groups action_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.action_groups
    ADD CONSTRAINT action_groups_pkey PRIMARY KEY (id);


--
-- Name: alerts alerts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alerts
    ADD CONSTRAINT alerts_pkey PRIMARY KEY (id);


--
-- Name: atlas_alerts atlas_alerts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atlas_alerts
    ADD CONSTRAINT atlas_alerts_pkey PRIMARY KEY (id);


--
-- Name: atlas_auto_actions atlas_auto_actions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atlas_auto_actions
    ADD CONSTRAINT atlas_auto_actions_pkey PRIMARY KEY (id);


--
-- Name: atlas_cases atlas_cases_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atlas_cases
    ADD CONSTRAINT atlas_cases_pkey PRIMARY KEY (id);


--
-- Name: atlas_tasks atlas_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atlas_tasks
    ADD CONSTRAINT atlas_tasks_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: billing_deals billing_deals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_deals
    ADD CONSTRAINT billing_deals_pkey PRIMARY KEY (id);


--
-- Name: clinical_notes clinical_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinical_notes
    ADD CONSTRAINT clinical_notes_pkey PRIMARY KEY (id);


--
-- Name: compliance_entries compliance_entries_patient_id_entry_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.compliance_entries
    ADD CONSTRAINT compliance_entries_patient_id_entry_date_key UNIQUE (patient_id, entry_date);


--
-- Name: compliance_entries compliance_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.compliance_entries
    ADD CONSTRAINT compliance_entries_pkey PRIMARY KEY (id);


--
-- Name: compliance_periods compliance_periods_patient_id_period_start_period_end_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.compliance_periods
    ADD CONSTRAINT compliance_periods_patient_id_period_start_period_end_key UNIQUE (patient_id, period_start, period_end);


--
-- Name: compliance_periods compliance_periods_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.compliance_periods
    ADD CONSTRAINT compliance_periods_pkey PRIMARY KEY (id);


--
-- Name: compliance compliance_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.compliance
    ADD CONSTRAINT compliance_pkey PRIMARY KEY (id);


--
-- Name: compliance_summary compliance_summary_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.compliance_summary
    ADD CONSTRAINT compliance_summary_pkey PRIMARY KEY (id);


--
-- Name: cpap_devices cpap_devices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cpap_devices
    ADD CONSTRAINT cpap_devices_pkey PRIMARY KEY (id);


--
-- Name: cpap_devices cpap_devices_serial_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cpap_devices
    ADD CONSTRAINT cpap_devices_serial_number_key UNIQUE (serial_number);


--
-- Name: device_inventory device_inventory_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.device_inventory
    ADD CONSTRAINT device_inventory_pkey PRIMARY KEY (id);


--
-- Name: devices devices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.devices
    ADD CONSTRAINT devices_pkey PRIMARY KEY (id);


--
-- Name: doctor_subscriptions doctor_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.doctor_subscriptions
    ADD CONSTRAINT doctor_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: doctors doctors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.doctors
    ADD CONSTRAINT doctors_pkey PRIMARY KEY (id);


--
-- Name: followup_reminders followup_reminders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.followup_reminders
    ADD CONSTRAINT followup_reminders_pkey PRIMARY KEY (id);


--
-- Name: followups followups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.followups
    ADD CONSTRAINT followups_pkey PRIMARY KEY (id);


--
-- Name: integrations integrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.integrations
    ADD CONSTRAINT integrations_pkey PRIMARY KEY (id);


--
-- Name: notes notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_pkey PRIMARY KEY (id);


--
-- Name: notification_queue notification_queue_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_queue
    ADD CONSTRAINT notification_queue_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: patient_action_status patient_action_status_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_action_status
    ADD CONSTRAINT patient_action_status_pkey PRIMARY KEY (id);


--
-- Name: patient_activation_codes patient_activation_codes_activation_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_activation_codes
    ADD CONSTRAINT patient_activation_codes_activation_code_key UNIQUE (activation_code);


--
-- Name: patient_activation_codes patient_activation_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_activation_codes
    ADD CONSTRAINT patient_activation_codes_pkey PRIMARY KEY (id);


--
-- Name: patient_events patient_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_events
    ADD CONSTRAINT patient_events_pkey PRIMARY KEY (id);


--
-- Name: patient_metrics patient_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_metrics
    ADD CONSTRAINT patient_metrics_pkey PRIMARY KEY (id);


--
-- Name: patient_subscriptions patient_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_subscriptions
    ADD CONSTRAINT patient_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: patients patients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: referrals referrals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_pkey PRIMARY KEY (id);


--
-- Name: subscriptions subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- Name: tenant_branding tenant_branding_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_branding
    ADD CONSTRAINT tenant_branding_pkey PRIMARY KEY (tenant_id);


--
-- Name: tenant_features tenant_features_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_features
    ADD CONSTRAINT tenant_features_pkey PRIMARY KEY (id);


--
-- Name: tenant_modules tenant_modules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_modules
    ADD CONSTRAINT tenant_modules_pkey PRIMARY KEY (id);


--
-- Name: tenant_payments tenant_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_payments
    ADD CONSTRAINT tenant_payments_pkey PRIMARY KEY (id);


--
-- Name: tenant_workspace_branding tenant_workspace_branding_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_workspace_branding
    ADD CONSTRAINT tenant_workspace_branding_pkey PRIMARY KEY (tenant_id);


--
-- Name: tenant_workspace_devices tenant_workspace_devices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_workspace_devices
    ADD CONSTRAINT tenant_workspace_devices_pkey PRIMARY KEY (id);


--
-- Name: tenant_workspace_followups tenant_workspace_followups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_workspace_followups
    ADD CONSTRAINT tenant_workspace_followups_pkey PRIMARY KEY (id);


--
-- Name: tenant_workspace_integrations tenant_workspace_integrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_workspace_integrations
    ADD CONSTRAINT tenant_workspace_integrations_pkey PRIMARY KEY (id);


--
-- Name: tenant_workspace_modules tenant_workspace_modules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_workspace_modules
    ADD CONSTRAINT tenant_workspace_modules_pkey PRIMARY KEY (id);


--
-- Name: tenant_workspace_notes tenant_workspace_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_workspace_notes
    ADD CONSTRAINT tenant_workspace_notes_pkey PRIMARY KEY (id);


--
-- Name: tenant_workspace_notifications tenant_workspace_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_workspace_notifications
    ADD CONSTRAINT tenant_workspace_notifications_pkey PRIMARY KEY (id);


--
-- Name: tenant_workspace_patients tenant_workspace_patients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_workspace_patients
    ADD CONSTRAINT tenant_workspace_patients_pkey PRIMARY KEY (id);


--
-- Name: tenant_workspace_referrals tenant_workspace_referrals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_workspace_referrals
    ADD CONSTRAINT tenant_workspace_referrals_pkey PRIMARY KEY (id);


--
-- Name: tenant_workspace_tasks tenant_workspace_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_workspace_tasks
    ADD CONSTRAINT tenant_workspace_tasks_pkey PRIMARY KEY (id);


--
-- Name: tenant_workspace_users tenant_workspace_users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_workspace_users
    ADD CONSTRAINT tenant_workspace_users_pkey PRIMARY KEY (id);


--
-- Name: tenants tenants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_pkey PRIMARY KEY (id);


--
-- Name: usage_logs usage_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usage_logs
    ADD CONSTRAINT usage_logs_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: idx_action_group_events_status_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_action_group_events_status_id ON public.action_group_events USING btree (patient_action_status_id);


--
-- Name: idx_atlas_alerts_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_atlas_alerts_tenant_id ON public.atlas_alerts USING btree (tenant_id);


--
-- Name: idx_atlas_auto_actions_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_atlas_auto_actions_tenant_id ON public.atlas_auto_actions USING btree (tenant_id);


--
-- Name: idx_atlas_cases_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_atlas_cases_tenant_id ON public.atlas_cases USING btree (tenant_id);


--
-- Name: idx_atlas_tasks_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_atlas_tasks_tenant_id ON public.atlas_tasks USING btree (tenant_id);


--
-- Name: idx_doctor_subscriptions_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_doctor_subscriptions_tenant_id ON public.doctor_subscriptions USING btree (tenant_id);


--
-- Name: idx_notification_queue_auto_action_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notification_queue_auto_action_id ON public.notification_queue USING btree (auto_action_id);


--
-- Name: idx_notification_queue_patient_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notification_queue_patient_id ON public.notification_queue USING btree (patient_id);


--
-- Name: idx_notification_queue_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notification_queue_status ON public.notification_queue USING btree (status);


--
-- Name: idx_patients_device_serial; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_patients_device_serial ON public.patients USING btree (device_serial);


--
-- Name: idx_payments_method; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payments_method ON public.payments USING btree (payment_method);


--
-- Name: idx_payments_provider_order_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payments_provider_order_id ON public.payments USING btree (provider_order_id);


--
-- Name: idx_payments_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payments_status ON public.payments USING btree (status);


--
-- Name: idx_payments_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payments_tenant_id ON public.payments USING btree (tenant_id);


--
-- Name: idx_tasks_action_group_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_action_group_id ON public.tasks USING btree (action_group_id);


--
-- Name: idx_tasks_patient_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_patient_id ON public.tasks USING btree (patient_id);


--
-- Name: idx_tasks_sla_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_sla_status ON public.tasks USING btree (sla_status);


--
-- Name: idx_tasks_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_status ON public.tasks USING btree (status);


--
-- Name: idx_tenant_payments_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tenant_payments_tenant_id ON public.tenant_payments USING btree (tenant_id);


--
-- Name: idx_twd_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_twd_tenant_id ON public.tenant_workspace_devices USING btree (tenant_id);


--
-- Name: idx_twf_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_twf_tenant_id ON public.tenant_workspace_followups USING btree (tenant_id);


--
-- Name: idx_twi_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_twi_tenant_id ON public.tenant_workspace_integrations USING btree (tenant_id);


--
-- Name: idx_twm_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_twm_tenant_id ON public.tenant_workspace_modules USING btree (tenant_id);


--
-- Name: idx_twn_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_twn_tenant_id ON public.tenant_workspace_notes USING btree (tenant_id);


--
-- Name: idx_twno_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_twno_tenant_id ON public.tenant_workspace_notifications USING btree (tenant_id);


--
-- Name: idx_twp_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_twp_tenant_id ON public.tenant_workspace_patients USING btree (tenant_id);


--
-- Name: idx_twr_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_twr_tenant_id ON public.tenant_workspace_referrals USING btree (tenant_id);


--
-- Name: idx_twt_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_twt_tenant_id ON public.tenant_workspace_tasks USING btree (tenant_id);


--
-- Name: idx_twu_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_twu_tenant_id ON public.tenant_workspace_users USING btree (tenant_id);


--
-- Name: idx_usage_patient_date; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_usage_patient_date ON public.usage_logs USING btree (patient_id, usage_date);


--
-- Name: idx_usage_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_usage_unique ON public.usage_logs USING btree (patient_id, usage_date);


--
-- Name: patients_device_serial_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX patients_device_serial_unique ON public.patients USING btree (device_serial) WHERE (device_serial IS NOT NULL);


--
-- Name: usage_logs_patient_date_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX usage_logs_patient_date_unique ON public.usage_logs USING btree (patient_id, usage_date);


--
-- Name: action_group_events action_group_events_patient_action_status_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.action_group_events
    ADD CONSTRAINT action_group_events_patient_action_status_id_fkey FOREIGN KEY (patient_action_status_id) REFERENCES public.patient_action_status(id) ON DELETE CASCADE;


--
-- Name: atlas_auto_actions atlas_auto_actions_patient_action_status_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atlas_auto_actions
    ADD CONSTRAINT atlas_auto_actions_patient_action_status_id_fkey FOREIGN KEY (patient_action_status_id) REFERENCES public.patient_action_status(id) ON DELETE CASCADE;


--
-- Name: atlas_auto_actions atlas_auto_actions_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atlas_auto_actions
    ADD CONSTRAINT atlas_auto_actions_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: clinical_notes clinical_notes_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinical_notes
    ADD CONSTRAINT clinical_notes_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.users(id);


--
-- Name: clinical_notes clinical_notes_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinical_notes
    ADD CONSTRAINT clinical_notes_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- Name: compliance_entries compliance_entries_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.compliance_entries
    ADD CONSTRAINT compliance_entries_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: compliance_periods compliance_periods_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.compliance_periods
    ADD CONSTRAINT compliance_periods_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: compliance_summary compliance_summary_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.compliance_summary
    ADD CONSTRAINT compliance_summary_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- Name: cpap_devices cpap_devices_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cpap_devices
    ADD CONSTRAINT cpap_devices_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- Name: device_inventory device_inventory_assigned_patient_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.device_inventory
    ADD CONSTRAINT device_inventory_assigned_patient_fkey FOREIGN KEY (assigned_patient) REFERENCES public.patients(id);


--
-- Name: doctor_subscriptions doctor_subscriptions_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.doctor_subscriptions
    ADD CONSTRAINT doctor_subscriptions_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctors(id) ON DELETE CASCADE;


--
-- Name: patients fk_doctor; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT fk_doctor FOREIGN KEY (doctor_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: followup_reminders followup_reminders_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.followup_reminders
    ADD CONSTRAINT followup_reminders_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: followup_reminders followup_reminders_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.followup_reminders
    ADD CONSTRAINT followup_reminders_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: notification_queue notification_queue_auto_action_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_queue
    ADD CONSTRAINT notification_queue_auto_action_id_fkey FOREIGN KEY (auto_action_id) REFERENCES public.atlas_auto_actions(id) ON DELETE SET NULL;


--
-- Name: notification_queue notification_queue_patient_action_status_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_queue
    ADD CONSTRAINT notification_queue_patient_action_status_id_fkey FOREIGN KEY (patient_action_status_id) REFERENCES public.patient_action_status(id) ON DELETE SET NULL;


--
-- Name: notification_queue notification_queue_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_queue
    ADD CONSTRAINT notification_queue_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: patient_action_status patient_action_status_action_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_action_status
    ADD CONSTRAINT patient_action_status_action_group_id_fkey FOREIGN KEY (action_group_id) REFERENCES public.action_groups(id) ON DELETE CASCADE;


--
-- Name: patient_action_status patient_action_status_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_action_status
    ADD CONSTRAINT patient_action_status_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: patient_activation_codes patient_activation_codes_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_activation_codes
    ADD CONSTRAINT patient_activation_codes_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: patient_events patient_events_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_events
    ADD CONSTRAINT patient_events_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- Name: patient_metrics patient_metrics_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_metrics
    ADD CONSTRAINT patient_metrics_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: patient_subscriptions patient_subscriptions_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_subscriptions
    ADD CONSTRAINT patient_subscriptions_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: subscriptions subscriptions_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: usage_logs usage_logs_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usage_logs
    ADD CONSTRAINT usage_logs_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- PostgreSQL database dump complete
--

\unrestrict JOGQ4tBiSJNr9TEPOx9uPVGDCOR9gIKUbz5TB5MDwiR8LkyehczhfCMZq4S7Zmw

