--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9
-- Dumped by pg_dump version 16.9

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
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
-- Name: instrument_inventory; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.instrument_inventory (
    id integer NOT NULL,
    serial_number text NOT NULL,
    instrument_type text NOT NULL,
    tuning_type text,
    color text,
    date_produced timestamp without time zone,
    status text DEFAULT 'available'::text NOT NULL,
    location text,
    craftsperson text,
    notes text,
    price integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.instrument_inventory OWNER TO neondb_owner;

--
-- Name: instrument_inventory_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.instrument_inventory_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.instrument_inventory_id_seq OWNER TO neondb_owner;

--
-- Name: instrument_inventory_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.instrument_inventory_id_seq OWNED BY public.instrument_inventory.id;


--
-- Name: material_mapping_rules; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.material_mapping_rules (
    id integer NOT NULL,
    name text NOT NULL,
    instrument_type text NOT NULL,
    instrument_size text,
    tuning_note text,
    bag_type text NOT NULL,
    bag_size text NOT NULL,
    box_size text NOT NULL,
    priority integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.material_mapping_rules OWNER TO neondb_owner;

--
-- Name: material_mapping_rules_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.material_mapping_rules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.material_mapping_rules_id_seq OWNER TO neondb_owner;

--
-- Name: material_mapping_rules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.material_mapping_rules_id_seq OWNED BY public.material_mapping_rules.id;


--
-- Name: materials_inventory; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.materials_inventory (
    id integer NOT NULL,
    material_name text NOT NULL,
    material_type text NOT NULL,
    bag_type text,
    size text NOT NULL,
    quantity integer DEFAULT 0 NOT NULL,
    reorder_point integer DEFAULT 5,
    ordered integer DEFAULT 0,
    expected_delivery timestamp without time zone,
    order_date timestamp without time zone,
    order_reference text,
    display_order integer DEFAULT 0,
    last_updated timestamp without time zone DEFAULT now(),
    notes text
);


ALTER TABLE public.materials_inventory OWNER TO neondb_owner;

--
-- Name: materials_inventory_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.materials_inventory_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.materials_inventory_id_seq OWNER TO neondb_owner;

--
-- Name: materials_inventory_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.materials_inventory_id_seq OWNED BY public.materials_inventory.id;


--
-- Name: mold_inventory; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.mold_inventory (
    id integer NOT NULL,
    name text NOT NULL,
    size text DEFAULT ''::text,
    instrument_type text NOT NULL,
    is_active boolean DEFAULT true,
    notes text,
    last_used timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.mold_inventory OWNER TO neondb_owner;

--
-- Name: mold_inventory_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.mold_inventory_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.mold_inventory_id_seq OWNER TO neondb_owner;

--
-- Name: mold_inventory_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.mold_inventory_id_seq OWNED BY public.mold_inventory.id;


--
-- Name: mold_mapping_items; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.mold_mapping_items (
    id integer NOT NULL,
    mapping_id integer NOT NULL,
    mold_id integer NOT NULL,
    order_index integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.mold_mapping_items OWNER TO neondb_owner;

--
-- Name: mold_mapping_items_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.mold_mapping_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.mold_mapping_items_id_seq OWNER TO neondb_owner;

--
-- Name: mold_mapping_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.mold_mapping_items_id_seq OWNED BY public.mold_mapping_items.id;


--
-- Name: mold_mappings; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.mold_mappings (
    id integer NOT NULL,
    name text NOT NULL,
    instrument_type text NOT NULL,
    tuning_note text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.mold_mappings OWNER TO neondb_owner;

--
-- Name: mold_mappings_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.mold_mappings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.mold_mappings_id_seq OWNER TO neondb_owner;

--
-- Name: mold_mappings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.mold_mappings_id_seq OWNED BY public.mold_mappings.id;


--
-- Name: order_items; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.order_items (
    id integer NOT NULL,
    order_id integer NOT NULL,
    serial_number text NOT NULL,
    item_type text NOT NULL,
    item_size text,
    tuning_type text,
    color text,
    weight text,
    craftsperson text,
    order_number text,
    order_date timestamp without time zone,
    deadline timestamp without time zone,
    build_date timestamp without time zone,
    bag_size text,
    box_size text,
    shopify_line_item_id text,
    specifications json,
    status text DEFAULT 'ordered'::text NOT NULL,
    progress integer DEFAULT 0,
    status_change_dates json DEFAULT '{}'::json,
    is_archived boolean DEFAULT false,
    archived_reason text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    workshop_notes text
);


ALTER TABLE public.order_items OWNER TO neondb_owner;

--
-- Name: COLUMN order_items.shopify_line_item_id; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.order_items.shopify_line_item_id IS 'Unieke Shopify line item ID voor permanente koppeling met serienummers';


--
-- Name: order_items_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.order_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.order_items_id_seq OWNER TO neondb_owner;

--
-- Name: order_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.order_items_id_seq OWNED BY public.order_items.id;


--
-- Name: orders; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.orders (
    id integer NOT NULL,
    order_number text NOT NULL,
    shopify_order_id text,
    customer_name text NOT NULL,
    customer_email text,
    customer_phone text,
    customer_address text,
    customer_city text,
    customer_state text,
    customer_zip text,
    customer_country text,
    order_type text NOT NULL,
    is_reseller boolean DEFAULT false,
    reseller_nickname text,
    status text DEFAULT 'ordered'::text NOT NULL,
    order_date timestamp without time zone DEFAULT now() NOT NULL,
    deadline timestamp without time zone,
    notes text,
    progress integer DEFAULT 0,
    specifications json,
    status_change_dates json DEFAULT '{}'::json,
    build_date timestamp without time zone,
    archived boolean DEFAULT false,
    tracking_number text,
    tracking_company text,
    tracking_url text,
    shipped_date timestamp without time zone,
    estimated_delivery_date timestamp without time zone,
    delivery_status text,
    delivered_date timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    is_urgent boolean DEFAULT false
);


ALTER TABLE public.orders OWNER TO neondb_owner;

--
-- Name: orders_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.orders_id_seq OWNER TO neondb_owner;

--
-- Name: orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.orders_id_seq OWNED BY public.orders.id;


--
-- Name: production_notes; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.production_notes (
    id integer NOT NULL,
    order_id integer NOT NULL,
    item_id integer,
    note text NOT NULL,
    created_by text NOT NULL,
    source text DEFAULT 'internal'::text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.production_notes OWNER TO neondb_owner;

--
-- Name: production_notes_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.production_notes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.production_notes_id_seq OWNER TO neondb_owner;

--
-- Name: production_notes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.production_notes_id_seq OWNED BY public.production_notes.id;


--
-- Name: resellers; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.resellers (
    id integer NOT NULL,
    name text NOT NULL,
    nickname text NOT NULL,
    business_name text,
    contact_name text NOT NULL,
    email text NOT NULL,
    phone text,
    address text,
    city text,
    state text,
    zip text,
    country text DEFAULT 'US'::text,
    discount_percentage integer DEFAULT 0,
    is_active boolean DEFAULT true,
    notes text,
    last_order_date timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.resellers OWNER TO neondb_owner;

--
-- Name: resellers_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.resellers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.resellers_id_seq OWNER TO neondb_owner;

--
-- Name: resellers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.resellers_id_seq OWNED BY public.resellers.id;


--
-- Name: session; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.session (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp(6) without time zone NOT NULL
);


ALTER TABLE public.session OWNER TO neondb_owner;

--
-- Name: shopify_item_tracking; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.shopify_item_tracking (
    id integer NOT NULL,
    order_id integer NOT NULL,
    used_suffixes json DEFAULT '[]'::json,
    item_mappings json DEFAULT '[]'::json,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.shopify_item_tracking OWNER TO neondb_owner;

--
-- Name: shopify_item_tracking_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.shopify_item_tracking_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.shopify_item_tracking_id_seq OWNER TO neondb_owner;

--
-- Name: shopify_item_tracking_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.shopify_item_tracking_id_seq OWNED BY public.shopify_item_tracking.id;


--
-- Name: timesheets; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.timesheets (
    id integer NOT NULL,
    employee_name text NOT NULL,
    work_date timestamp without time zone DEFAULT now() NOT NULL,
    start_time timestamp without time zone NOT NULL,
    end_time timestamp without time zone,
    total_time_minutes integer,
    break_time_minutes integer DEFAULT 0,
    worked_time_minutes integer,
    hourly_rate integer DEFAULT 1500,
    total_amount integer,
    is_paid boolean DEFAULT false,
    paid_date timestamp without time zone,
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.timesheets OWNER TO neondb_owner;

--
-- Name: timesheets_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.timesheets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.timesheets_id_seq OWNER TO neondb_owner;

--
-- Name: timesheets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.timesheets_id_seq OWNED BY public.timesheets.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username text NOT NULL,
    password text NOT NULL,
    current_challenge text,
    device_id text,
    remember_token text,
    last_login timestamp without time zone
);


ALTER TABLE public.users OWNER TO neondb_owner;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO neondb_owner;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: instrument_inventory id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.instrument_inventory ALTER COLUMN id SET DEFAULT nextval('public.instrument_inventory_id_seq'::regclass);


--
-- Name: material_mapping_rules id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.material_mapping_rules ALTER COLUMN id SET DEFAULT nextval('public.material_mapping_rules_id_seq'::regclass);


--
-- Name: materials_inventory id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.materials_inventory ALTER COLUMN id SET DEFAULT nextval('public.materials_inventory_id_seq'::regclass);


--
-- Name: mold_inventory id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.mold_inventory ALTER COLUMN id SET DEFAULT nextval('public.mold_inventory_id_seq'::regclass);


--
-- Name: mold_mapping_items id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.mold_mapping_items ALTER COLUMN id SET DEFAULT nextval('public.mold_mapping_items_id_seq'::regclass);


--
-- Name: mold_mappings id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.mold_mappings ALTER COLUMN id SET DEFAULT nextval('public.mold_mappings_id_seq'::regclass);


--
-- Name: order_items id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.order_items ALTER COLUMN id SET DEFAULT nextval('public.order_items_id_seq'::regclass);


--
-- Name: orders id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);


--
-- Name: production_notes id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.production_notes ALTER COLUMN id SET DEFAULT nextval('public.production_notes_id_seq'::regclass);


--
-- Name: resellers id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.resellers ALTER COLUMN id SET DEFAULT nextval('public.resellers_id_seq'::regclass);


--
-- Name: shopify_item_tracking id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.shopify_item_tracking ALTER COLUMN id SET DEFAULT nextval('public.shopify_item_tracking_id_seq'::regclass);


--
-- Name: timesheets id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.timesheets ALTER COLUMN id SET DEFAULT nextval('public.timesheets_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: instrument_inventory; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.instrument_inventory (id, serial_number, instrument_type, tuning_type, color, date_produced, status, location, craftsperson, notes, price, created_at, updated_at) FROM stdin;
1	SW-I5001	INNATO_F3	B	terra	2025-04-01 00:00:00	available	showroom	Marco	Testmodel voor het systeem	149995	2025-04-01 12:34:56	2025-04-01 12:34:56
\.


--
-- Data for Name: material_mapping_rules; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.material_mapping_rules (id, name, instrument_type, instrument_size, tuning_note, bag_type, bag_size, box_size, priority, is_active, created_at, updated_at) FROM stdin;
1	Innato A3 Default Packaging	INNATO_A3	\N	\N	Innato	L	31x31x31	10	t	2025-04-03 15:30:00	2025-04-03 15:30:00
2	Innato B3 Default Packaging	INNATO_B3	\N	\N	Innato	L	31x31x31	10	t	2025-04-03 15:30:00	2025-04-03 15:30:00
3	Innato C3 Default Packaging	INNATO_C3	\N	\N	Innato	L	31x31x31	10	t	2025-04-03 15:30:00	2025-04-03 15:30:00
4	Innato E3 Default Packaging	INNATO_E3	\N	\N	Innato	L	31x31x31	10	t	2025-04-03 15:30:00	2025-04-03 15:30:00
5	Innato F3 Default Packaging	INNATO_F3	\N	\N	Innato	L	31x31x31	10	t	2025-04-03 15:30:00	2025-04-03 15:30:00
6	Natey Default Packaging	NATEY_A4	\N	\N	Natey	M	20x20x20	10	t	2025-04-03 15:30:00	2025-04-03 15:30:00
7	Natey F# Default Packaging	NATEY_F#4	\N	\N	Natey	M	20x20x20	10	t	2025-04-03 15:30:00	2025-04-03 15:30:00
8	Natey G# Default Packaging	NATEY_G#4	\N	\N	Natey	M	20x20x20	10	t	2025-04-03 15:30:00	2025-04-03 15:30:00
9	Natey G3 Default Packaging	NATEY_G3	\N	\N	Natey	M	20x20x20	10	t	2025-04-03 15:30:00	2025-04-03 15:30:00
10	Natey C4 Default Packaging	NATEY_C4	\N	\N	Natey	M	20x20x20	10	t	2025-04-03 15:30:00	2025-04-03 15:30:00
11	Double C4 Default Packaging	DOUBLE_C4	\N	\N	Double	M	20x20x20	10	t	2025-04-03 15:30:00	2025-04-03 15:30:00
12	ZEN M Default Packaging	ZEN_M	\N	\N	ZEN	M	15x15x15	10	t	2025-04-03 15:30:00	2025-04-03 15:30:00
13	ZEN L Default Packaging	ZEN_L	\N	\N	ZEN	L	20x20x20	10	t	2025-04-03 15:30:00	2025-04-03 15:30:00
\.


--
-- Data for Name: materials_inventory; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.materials_inventory (id, material_name, material_type, bag_type, size, quantity, reorder_point, ordered, expected_delivery, order_date, order_reference, display_order, last_updated, notes) FROM stdin;
1	Innato bag S	bag	Innato	S	25	5	0	\N	\N	\N	1	2025-04-03 15:30:00	\N
2	Innato bag M	bag	Innato	M	20	5	0	\N	\N	\N	2	2025-04-03 15:30:00	\N
3	Innato bag L	bag	Innato	L	15	5	0	\N	\N	\N	3	2025-04-03 15:30:00	\N
4	Innato bag XL	bag	Innato	XL	10	3	0	\N	\N	\N	4	2025-04-03 15:30:00	\N
5	Natey bag S	bag	Natey	S	25	5	0	\N	\N	\N	5	2025-04-03 15:30:00	\N
6	Natey bag M	bag	Natey	M	20	5	0	\N	\N	\N	6	2025-04-03 15:30:00	\N
7	Natey bag L	bag	Natey	L	15	5	0	\N	\N	\N	7	2025-04-03 15:30:00	\N
8	ZEN bag S	bag	ZEN	S	25	5	0	\N	\N	\N	8	2025-04-03 15:30:00	\N
9	ZEN bag M	bag	ZEN	M	20	5	0	\N	\N	\N	9	2025-04-03 15:30:00	\N
10	ZEN bag L	bag	ZEN	L	15	5	0	\N	\N	\N	10	2025-04-03 15:30:00	\N
11	Double bag S	bag	Double	S	25	5	0	\N	\N	\N	11	2025-04-03 15:30:00	\N
12	Double bag M	bag	Double	M	20	5	0	\N	\N	\N	12	2025-04-03 15:30:00	\N
13	Double bag L	bag	Double	L	15	5	0	\N	\N	\N	13	2025-04-03 15:30:00	\N
14	Box 15x15x15	box	\N	15x15x15	30	10	0	\N	\N	\N	20	2025-04-03 15:30:00	\N
15	Box 20x20x20	box	\N	20x20x20	25	10	0	\N	\N	\N	21	2025-04-03 15:30:00	\N
16	Box 30x12x12	box	\N	30x12x12	20	10	0	\N	\N	\N	22	2025-04-03 15:30:00	\N
17	Box 31x31x31	box	\N	31x31x31	15	5	0	\N	\N	\N	23	2025-04-03 15:30:00	\N
18	Box 35x35x30	box	\N	35x35x30	10	5	0	\N	\N	\N	24	2025-04-03 15:30:00	\N
\.


--
-- Data for Name: mold_inventory; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.mold_inventory (id, name, size, instrument_type, is_active, notes, last_used, created_at, updated_at) FROM stdin;
55	OvA		OvA	t		\N	2025-05-15 05:23:14.018915	2025-05-15 05:23:14.018915
56	17 21,5 25		INNATO	t		\N	2025-05-15 05:28:35.50905	2025-05-15 05:28:35.50905
57	21,5 28 32		INNATO	t		\N	2025-05-15 08:55:20.118742	2025-05-15 08:55:20.118742
58	13 18 21,5		INNATO	t		\N	2025-07-16 09:33:58.161352	2025-07-16 09:33:58.161352
28	12 17 19		INNATO	t		\N	2025-05-15 05:15:58.022757	2025-05-15 05:15:58.022757
29	13 18 20,5		INNATO	t		\N	2025-05-15 05:16:25.442315	2025-05-15 05:16:25.442315
30	14 19 22		INNATO	t		\N	2025-05-15 05:16:39.876249	2025-05-15 05:16:39.876249
31	15 19 23 SM		INNATO	t		\N	2025-05-15 05:17:11.93592	2025-05-15 05:17:11.93592
32	16 20,5 24		INNATO	t		\N	2025-05-15 05:18:17.745123	2025-05-15 05:18:17.745123
33	17 22 26		INNATO	t		\N	2025-05-15 05:18:30.488605	2025-05-15 05:18:30.488605
34	18 24 28		INNATO	t		\N	2025-05-15 05:18:39.348607	2025-05-15 05:18:39.348607
35	19 26 30		INNATO	t		\N	2025-05-15 05:18:50.260291	2025-05-15 05:18:50.260291
36	19 26 30		INNATO	t		\N	2025-05-15 05:18:58.365291	2025-05-15 05:18:58.365291
38	14		NATEY	t		\N	2025-05-15 05:20:37.996865	2025-05-15 05:20:37.996865
39	15		NATEY	t		\N	2025-05-15 05:20:44.933965	2025-05-15 05:20:44.933965
40	16		NATEY	t		\N	2025-05-15 05:20:51.436916	2025-05-15 05:20:51.436916
41	17		NATEY	t		\N	2025-05-15 05:21:02.646732	2025-05-15 05:21:02.646732
42	18		NATEY	t		\N	2025-05-15 05:21:12.254483	2025-05-15 05:21:12.254483
43	19		NATEY	t		\N	2025-05-15 05:21:19.01583	2025-05-15 05:21:19.01583
44	20,5		NATEY	t		\N	2025-05-15 05:21:26.305357	2025-05-15 05:21:26.305357
45	22		NATEY	t		\N	2025-05-15 05:21:35.784145	2025-05-15 05:21:35.784145
46	23		NATEY	t		\N	2025-05-15 05:21:41.172674	2025-05-15 05:21:41.172674
47	24		NATEY	t		\N	2025-05-15 05:21:47.146675	2025-05-15 05:21:47.146675
48	25		NATEY	t		\N	2025-05-15 05:21:54.457706	2025-05-15 05:21:54.457706
49	26		NATEY	t		\N	2025-05-15 05:22:00.098969	2025-05-15 05:22:00.098969
51	ZEN M		ZEN	t		\N	2025-05-15 05:22:39.447693	2025-05-15 05:22:39.447693
52	ZEN L		ZEN	t		\N	2025-05-15 05:22:46.557281	2025-05-15 05:22:46.557281
53	DOUBLE M		DOUBLE	t		\N	2025-05-15 05:22:54.955688	2025-05-15 05:22:54.955688
54	DOUBLE L		DOUBLE	t		\N	2025-05-15 05:23:03.397357	2025-05-15 05:23:03.397357
\.


--
-- Data for Name: mold_mapping_items; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.mold_mapping_items (id, mapping_id, mold_id, order_index, created_at) FROM stdin;
81	60	41	0	2025-05-15 05:32:26.465278
83	62	43	0	2025-05-15 05:32:50.604775
86	64	44	0	2025-05-15 05:33:15.454187
87	65	45	0	2025-05-15 05:33:25.188476
90	66	45	0	2025-05-15 05:33:44.45193
91	67	46	0	2025-05-15 05:33:57.998668
93	69	51	0	2025-05-15 05:34:54.580089
94	70	52	0	2025-05-15 05:35:00.14155
95	71	53	0	2025-05-15 05:35:56.908399
99	72	53	0	2025-05-15 05:36:24.660081
101	73	53	0	2025-05-15 05:36:39.76461
102	74	54	0	2025-05-15 05:36:52.997771
104	75	54	0	2025-05-15 05:37:09.903126
106	76	54	0	2025-05-15 05:37:30.378645
109	77	55	0	2025-05-15 05:38:05.084768
111	53	57	0	2025-05-15 08:55:31.977704
65	49	34	0	2025-05-15 05:29:08.28304
114	47	33	0	2025-05-17 14:55:42.181613
67	50	34	0	2025-05-15 05:29:33.465468
68	51	36	0	2025-05-15 05:29:53.91652
70	52	36	0	2025-05-15 05:30:13.243478
72	54	38	0	2025-05-15 05:30:33.056488
74	55	38	0	2025-05-15 05:30:55.47463
75	56	39	0	2025-05-15 05:31:06.951905
76	57	40	0	2025-05-15 05:31:17.31089
78	58	40	0	2025-05-15 05:31:29.010286
124	42	29	0	2025-05-20 12:02:56.548066
127	44	30	0	2025-05-20 12:03:42.976881
128	45	31	0	2025-05-20 12:03:53.69706
129	46	32	0	2025-05-20 12:04:13.337405
131	68	48	0	2025-06-17 12:57:25.900379
132	63	44	0	2025-06-24 10:48:26.350272
133	59	28	0	2025-06-30 12:00:29.536633
134	43	58	0	2025-07-16 09:34:26.756949
135	41	29	0	2025-07-16 09:49:07.224016
137	48	33	0	2025-07-16 13:23:07.060246
138	61	43	0	2025-07-24 07:23:14.012108
\.


--
-- Data for Name: mold_mappings; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.mold_mappings (id, name, instrument_type, tuning_note, is_active, created_at, updated_at) FROM stdin;
41	INNATO E4	INNATO	E4	t	2025-05-15 05:19:15.228433	2025-05-15 05:19:15.228433
42	INNATO D#4	INNATO	D#4	t	2025-05-15 05:19:25.472566	2025-05-15 05:19:25.472566
43	INNATO D4	INNATO	D4	t	2025-05-15 05:19:30.384956	2025-05-15 05:19:30.384956
44	INNATO C#4	INNATO	C#4	t	2025-05-15 05:19:35.546343	2025-05-15 05:19:35.546343
45	INNATO C4	INNATO	C4	t	2025-05-15 05:19:41.302003	2025-05-15 05:19:41.302003
46	INNATO B3	INNATO	B3	t	2025-05-15 05:19:44.369695	2025-05-15 05:19:44.369695
47	INNATO Bb3	INNATO	Bb3	t	2025-05-15 05:19:48.374373	2025-05-15 05:19:48.374373
48	INNATO A3	INNATO	A3	t	2025-05-15 05:19:53.523934	2025-05-15 05:19:53.523934
49	INNATO G#3	INNATO	G#3	t	2025-05-15 05:20:00.345645	2025-05-15 05:20:00.345645
50	INNATO G3	INNATO	G3	t	2025-05-15 05:20:04.661143	2025-05-15 05:20:04.661143
51	INNATO F#3	INNATO	F#3	t	2025-05-15 05:20:10.532427	2025-05-15 05:20:10.532427
52	INNATO F3	INNATO	F3	t	2025-05-15 05:20:14.82004	2025-05-15 05:20:14.82004
53	INNATO E3	INNATO	E3	t	2025-05-15 05:20:21.09671	2025-05-15 05:20:21.09671
54	NATEY A4	NATEY	A4	t	2025-05-15 05:23:29.200047	2025-05-15 05:23:29.200047
55	NATEY G#4	NATEY	G#4	t	2025-05-15 05:23:35.126753	2025-05-15 05:23:35.126753
56	NATEY G4	NATEY	G4	t	2025-05-15 05:23:39.798978	2025-05-15 05:23:39.798978
57	NATEY F#4	NATEY	F#4	t	2025-05-15 05:23:47.30694	2025-05-15 05:23:47.30694
58	NATEY F4	NATEY	F4	t	2025-05-15 05:23:53.901481	2025-05-15 05:23:53.901481
59	NATEY E4	NATEY	E4	t	2025-05-15 05:24:00.442457	2025-05-15 05:24:00.442457
60	NATEY D#4	NATEY	D#4	t	2025-05-15 05:24:07.626634	2025-05-15 05:24:07.626634
61	NATEY D4	NATEY	D4	t	2025-05-15 05:24:12.830242	2025-05-15 05:24:12.830242
62	NATEY C#4	NATEY	C#4	t	2025-05-15 05:24:17.999465	2025-05-15 05:24:17.999465
63	NATEY C4	NATEY	C4	t	2025-05-15 05:24:22.325428	2025-05-15 05:24:22.325428
64	NATEY B3	NATEY	B3	t	2025-05-15 05:24:31.841905	2025-05-15 05:24:31.841905
65	NATEY Bb3	NATEY	Bb3	t	2025-05-15 05:24:40.244174	2025-05-15 05:24:40.244174
66	NATEY A3	NATEY	A3	t	2025-05-15 05:24:46.319041	2025-05-15 05:24:46.319041
67	NATEY G#3	NATEY	G#3	t	2025-05-15 05:24:53.158077	2025-05-15 05:24:53.158077
68	NATEY G3	NATEY	G3	t	2025-05-15 05:25:02.244047	2025-05-15 05:25:02.244047
69	ZEN M	ZEN	M	t	2025-05-15 05:34:39.619807	2025-05-15 05:34:39.619807
70	ZEN L	ZEN	L	t	2025-05-15 05:34:48.06018	2025-05-15 05:34:48.06018
71	DOUBLE C#4	DOUBLE	C#4	t	2025-05-15 05:35:07.157384	2025-05-15 05:35:07.157384
72	DOUBLE C4	DOUBLE	C4	t	2025-05-15 05:35:16.900498	2025-05-15 05:35:16.900498
73	DOUBLE B3	DOUBLE	B3	t	2025-05-15 05:35:21.72445	2025-05-15 05:35:21.72445
74	DOUBLE Bb3	DOUBLE	Bb3	t	2025-05-15 05:35:26.342324	2025-05-15 05:35:26.342324
75	DOUBLE A3	DOUBLE	A3	t	2025-05-15 05:35:34.390773	2025-05-15 05:35:34.390773
76	DOUBLE G#3	DOUBLE	G#3	t	2025-05-15 05:35:42.37711	2025-05-15 05:35:42.37711
77	DOUBLE G3	DOUBLE	G3	t	2025-05-15 05:35:48.719893	2025-05-15 05:35:48.719893
78	OvA 64 Hz	OvA	64 Hz	t	2025-05-15 05:37:59.186587	2025-05-15 05:37:59.186587
\.


--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.order_items (id, order_id, serial_number, item_type, item_size, tuning_type, color, weight, craftsperson, order_number, order_date, deadline, build_date, bag_size, box_size, shopify_line_item_id, specifications, status, progress, status_change_dates, is_archived, archived_reason, created_at, updated_at, workshop_notes) FROM stdin;
4396	400	1646-7	Natey Cm4	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-24 11:21:06.371	\N	\N	\N	{"type":"Natey Cm4","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"Cm4","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-07-17T09:26:43.859Z","validated":"2025-07-18T10:53:42.471Z","building":"2025-07-24T11:21:06.371Z"}	f	\N	2025-07-16 09:32:44.579731	2025-07-25 07:54:10.356	\N
4397	400	1646-8	Natey Cm4	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-24 11:35:57.74	\N	\N	\N	{"type":"Natey Cm4","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"Cm4","color":"Smokefired Terra with Terra and bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-07-17T09:51:51.450Z","validated":"2025-07-18T11:01:32.036Z","building":"2025-07-24T11:35:57.739Z"}	f	\N	2025-07-16 09:32:44.672661	2025-07-25 07:54:10.372	\N
4348	370	1616-1	Innato Am3	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-16 12:07:43.677	\N	\N	16754237145419	{"type":"Innato Am3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Am3","color":"Blue, with Terra and Gold Bubbles","key":"432 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-07-08T10:55:48.425Z","validated":"2025-07-08T10:55:49.131Z","building":"2025-07-16T12:07:43.677Z"}	f	\N	2025-06-05 05:07:50.171289	2025-07-25 07:50:28.686	\N
4287	337	1573-1	Innato Em4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"type":"Innato Em4","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Em4","color":"Smokefired Terra and Black","key":"440 Hz","fulfillable_quantity":"0"}	ordered	0	{"ordered":"2025-05-13T15:24:38.952Z"}	t	Automatisch gearchiveerd omdat het item al is fulfilled in Shopify	2025-05-13 14:57:01.384311	2025-05-13 14:57:01.384311	\N
4398	400	1646-9	Natey Dm4	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-24 06:08:17.928	\N	\N	\N	{"type":"Natey Dm4","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"Dm4","color":"Blue, with Terra and Gold Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-07-16T12:00:43.320Z","validated":"2025-07-18T11:59:40.790Z","building":"2025-07-24T06:08:17.927Z"}	f	\N	2025-07-16 09:32:44.769138	2025-07-25 07:54:10.388	\N
4378	390	1635-1	Natey Gm3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"type":"Natey Gm3","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"Gm3","color":"Smokefired black with Terra and Copper Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{"dry":"2025-07-24T13:05:21.554Z"}	f	\N	2025-06-29 05:52:04.348842	2025-07-25 07:54:11.973	\N
4286	336	1574-1	Innato Bm3	\N	\N	\N	2.1	\N	\N	\N	\N	2025-06-09 13:44:49.972	\N	\N	16509335044427	{"type":"Innato Bm3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Bm3","color":"Blue, with Terra and Gold Bubbles","key":"432 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-06-09T11:37:13.043Z","validated":"2025-06-09T11:37:14.277Z","building":"2025-06-09T13:44:49.972Z","testing":"2025-06-30T10:38:28.031Z","firing":"2025-06-30T10:38:29.207Z","smoothing":"2025-06-30T10:38:30.295Z","tuning1":"2025-06-30T10:38:31.851Z","waxing":"2025-06-30T10:38:33.306Z","tuning2":"2025-07-04T07:24:25.414Z","bagging":"2025-07-04T08:16:06.544Z","boxing":"2025-07-04T10:28:39.085Z","labeling":"2025-07-04T11:05:07.938Z"}	t	Order fulfilled in Shopify	2025-05-13 14:57:01.240009	2025-07-25 07:50:40.256	\N
4350	371	1617-1	Double Large Native Gm3	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-13 06:21:34.082	\N	\N	16757432910155	{"type":"Double Large Native Gm3","model":"DOUBLE","fluteType":"DOUBLE","tuningFrequency":"440Hz","frequency":"440","tuning":"Gm3","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	archived	0	{"ordered":"2025-07-06T12:21:36.536Z","validated":"2025-07-13T06:21:30.542Z","dry":"2025-07-13T06:21:32.926Z","building":"2025-07-13T06:21:34.082Z","bagging":"2025-07-15T11:25:02.535Z"}	t	Automatically marked as archived during Shopify sync	2025-06-05 12:44:57.4467	2025-07-15 11:49:42.137	\N
4395	400	1646-6	Natey Cm4	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-24 09:27:43.871	\N	\N	\N	{"type":"Natey Cm4","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"Cm4","color":"Blue, with Terra and Gold Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-07-17T08:49:13.363Z","validated":"2025-07-18T10:47:33.289Z","building":"2025-07-24T09:27:43.871Z"}	f	\N	2025-07-16 09:32:44.485697	2025-07-25 07:54:10.339	\N
4329	358	1604-16	Natey Fm4	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-06 11:22:43.392	\N	\N	16691002048843	{"type":"Natey Fm4","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"Fm4","color":"Smokefired Terra with Terra and bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-07-06T11:22:39.586Z","dry":"2025-07-06T11:22:40.887Z","building":"2025-07-06T11:22:43.391Z","validated":"2025-07-06T11:22:44.627Z","testing":"2025-07-12T13:33:49.206Z","firing":"2025-07-12T13:33:50.697Z","tuning1":"2025-07-12T13:33:51.819Z","waxing":"2025-07-12T13:33:53.131Z","tuning2":"2025-07-12T13:33:54.079Z","bagging":"2025-07-15T11:27:08.655Z"}	t	Order fulfilled in Shopify	2025-05-21 07:08:04.504426	2025-07-25 07:50:32.192	\N
1	1	SW-I1001	INNATO_A3	\N	B	terra	\N	Marco	SW-2025-001	2025-05-01 00:00:00	2025-05-25 00:00:00	\N	L	31x31x31	gid://shopify/LineItem/12345678901	{"voicing": "standard", "vessel_color": "terra"}	archived	30	{"ordered":"2025-03-15T15:24:38.952Z","validated":"2025-03-18T15:24:38.952Z","building":"2025-03-21T15:24:38.952Z","testing":"2025-03-24T15:24:38.952Z","terrasigillata":"2025-03-27T15:24:38.952Z","firing":"2025-03-30T15:24:38.952Z","smokefiring":"2025-04-02T15:24:38.952Z","tuning1":"2025-04-05T15:24:38.952Z","tuning2":"2025-04-08T15:24:38.952Z","quality_check":"2025-04-11T15:24:38.952Z","ready":"2025-04-14T15:24:38.952Z","shipping":"2025-04-17T15:24:38.952Z","delivered":"2025-04-20T15:24:38.952Z","archived":"2025-04-23T15:24:38.952Z"}	t	Order automatisch gearchiveerd omdat deze niet meer actief is in Shopify	2025-05-01 00:00:00	2025-05-13 14:49:18.337	\N
4290	340	1570-1	Innato Dm4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"type":"Innato Dm4","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Dm4","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"0"}	ordered	0	{"ordered":"2025-05-13T15:24:38.952Z"}	t	Automatisch gearchiveerd omdat het item al is fulfilled in Shopify	2025-05-13 14:57:01.88566	2025-05-13 14:57:01.88566	\N
24	14	1589-1	Natey Dm4	\N	\N	\N	.5	\N	\N	\N	\N	2025-06-18 10:10:25.454	\N	\N	16590850326859	{"type":"Natey Dm4","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"Dm4","color":"Blue, with Terra and Gold Bubbles","key":"432 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-06-05T13:15:30.498Z","validated":"2025-06-18T10:10:24.498Z","building":"2025-06-18T10:10:25.454Z","testing":"2025-06-30T10:31:46.947Z","firing":"2025-06-30T10:31:48.113Z","smoothing":"2025-06-30T10:31:49.176Z","tuning1":"2025-06-30T10:31:50.136Z","waxing":"2025-06-30T10:31:51.136Z","tuning2":"2025-06-30T10:31:52.350Z","bagging":"2025-07-04T08:12:39.312Z","boxing":"2025-07-04T10:29:03.805Z","labeling":"2025-07-04T11:07:20.631Z"}	t	Order fulfilled in Shopify	2025-05-13 14:49:22.55223	2025-07-25 07:50:36.349	\N
4299	348	1560-2	Innato Am3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"type":"Innato Am3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Am3","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"0"}	ordered	0	{"ordered":"2025-05-13T15:24:38.952Z"}	t	Order fulfilled in Shopify	2025-05-13 14:57:03.263108	2025-07-25 07:50:43.342	\N
4400	400	1646-11	Natey F#m4	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-24 06:50:14.588	\N	\N	\N	{"type":"Natey F#m4","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"F#m4","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-07-16T13:00:07.790Z","validated":"2025-07-18T08:08:56.646Z","building":"2025-07-24T06:50:14.588Z"}	f	\N	2025-07-16 09:32:44.95173	2025-07-25 07:54:10.431	\N
4291	341	1568-1	Innato Cm4	\N	\N	\N	2	\N	\N	\N	\N	2025-05-13 18:08:00.192	\N	\N	16492498616651	{"type":"Innato Cm4","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Cm4","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-05-13T15:24:38.952Z","validated":"2025-05-13T18:07:58.810Z","dry":"2025-05-13T18:07:59.588Z","building":"2025-05-13T18:08:00.192Z","testing":"2025-05-14T12:41:59.319Z","firing":"2025-05-14T12:42:00.169Z","tuning1":"2025-05-17T11:26:26.837Z","waxing":"2025-05-17T11:26:28.028Z","tuning2":"2025-05-17T11:26:28.903Z","bagging":"2025-05-17T12:32:17.416Z","boxing":"2025-05-17T12:32:18.467Z","labeling":"2025-05-17T12:41:25.574Z"}	t	Order fulfilled in Shopify	2025-05-13 14:57:02.162424	2025-07-25 07:50:41.646	\N
4298	348	1560-1	Innato Am3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"type":"Innato Am3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Am3","color":"Blue, with Terra and Gold Bubbles","key":"440 Hz","fulfillable_quantity":"0"}	ordered	0	{"ordered":"2025-05-13T15:24:38.952Z"}	t	Order fulfilled in Shopify	2025-05-13 14:57:03.227639	2025-07-25 07:50:43.295	\N
4304	349	1559-3	Innato Em3 (NEW)	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"type":"Innato Em3 (NEW)","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Em3","color":"Blue, with Terra and Gold Bubbles","key":"440 Hz","fulfillable_quantity":"0"}	ordered	0	{"ordered":"2025-05-12T15:24:38.952Z"}	t	Order fulfilled in Shopify	2025-05-13 14:57:03.554603	2025-07-25 07:50:43.729	\N
4401	400	1646-12	Natey Fm4	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-24 07:52:12.196	\N	\N	\N	{"type":"Natey Fm4","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"Fm4","color":"Blue, with Terra and Gold Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-07-24T07:33:00.682Z","validated":"2025-07-24T07:33:04.051Z","building":"2025-07-24T07:52:12.196Z"}	f	\N	2025-07-16 09:32:45.042464	2025-07-25 07:54:10.447	\N
4296	346	1563-1	Innato Cm4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"type":"Innato Cm4","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Cm4","color":"Smokefired black with Terra and Copper Bubbles","key":"440 Hz","fulfillable_quantity":"0"}	ordered	0	{"ordered":"2025-05-13T15:24:38.952Z"}	t	Automatisch gearchiveerd omdat het item al is fulfilled in Shopify	2025-05-13 14:57:02.914065	2025-05-13 14:57:02.914065	\N
4281	331	1579-1	Innato Bbm3	\N	\N	\N	2.1	\N	\N	\N	\N	2025-05-24 09:52:11.337	\N	\N	16560707633483	{"type":"Innato Bbm3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Bbm3","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-05-22T12:43:24.044Z","validated":"2025-05-22T12:43:26.448Z","building":"2025-05-24T09:52:11.337Z","testing":"2025-06-05T07:21:47.323Z","firing":"2025-06-05T13:56:20.770Z","tuning1":"2025-06-05T13:56:21.435Z","waxing":"2025-06-05T13:56:22.284Z","tuning2":"2025-06-07T09:26:34.241Z","bagging":"2025-06-07T19:38:58.584Z","boxing":"2025-06-07T19:38:59.348Z","labeling":"2025-06-08T08:17:54.197Z"}	t	Order fulfilled in Shopify	2025-05-13 14:57:00.488478	2025-07-25 07:50:39.303	\N
4305	349	1559-4	Innato G#m3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"type":"Innato G#m3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"G#m3","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"0"}	ordered	0	{"ordered":"2025-05-12T15:24:38.952Z"}	t	Order fulfilled in Shopify	2025-05-13 14:57:03.589416	2025-07-25 07:50:43.775	\N
4402	400	1646-13	Natey Fm4	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-24 11:50:22.714	\N	\N	\N	{"type":"Natey Fm4","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"Fm4","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-07-17T08:49:35.708Z","validated":"2025-07-18T10:36:36.523Z","building":"2025-07-24T11:50:22.714Z"}	f	\N	2025-07-16 09:32:45.13398	2025-07-25 07:54:10.463	\N
4399	400	1646-10	Natey Dm4	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-24 08:46:40.902	\N	\N	\N	{"type":"Natey Dm4","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"Dm4","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-07-24T07:57:50.707Z","validated":"2025-07-24T07:57:51.293Z","building":"2025-07-24T08:46:40.902Z"}	f	\N	2025-07-16 09:32:44.859832	2025-07-25 07:54:10.413	\N
4404	400	1646-15	Natey Gm4	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-23 11:49:38.957	\N	\N	\N	{"type":"Natey Gm4","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"Gm4","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-07-16T11:08:32.440Z","validated":"2025-07-18T11:15:30.492Z","building":"2025-07-23T11:49:38.957Z"}	f	\N	2025-07-16 09:32:45.318282	2025-07-25 07:54:10.497	\N
4306	350	1557-1	Innato Am3	\N	\N	\N	1557	\N	\N	\N	\N	2025-06-16 11:34:38.204	\N	\N	16465822089547	{"type":"Innato Am3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Am3","color":"Smokefired Terra with Terra and bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-06-09T09:47:52.970Z","validated":"2025-06-11T08:19:18.834Z","building":"2025-06-16T11:34:38.204Z","testing":"2025-06-30T10:36:15.447Z","firing":"2025-06-30T10:36:16.534Z","tuning1":"2025-06-30T10:36:17.554Z","waxing":"2025-06-30T10:36:18.575Z","tuning2":"2025-07-04T07:30:17.057Z","bagging":"2025-07-04T08:15:12.969Z","boxing":"2025-07-04T10:28:36.788Z","labeling":"2025-07-04T11:01:17.817Z"}	t	Order fulfilled in Shopify	2025-05-13 14:57:03.757847	2025-07-25 07:50:44.014	\N
4403	400	1646-14	Natey Gm4	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-23 10:53:40.769	\N	\N	\N	{"type":"Natey Gm4","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"Gm4","color":"Blue, with Terra and Gold Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{"validated":"2025-07-18T11:08:55.837Z","building":"2025-07-23T10:53:40.768Z","ordered":"2025-07-24T07:47:13.518Z"}	f	\N	2025-07-16 09:32:45.227415	2025-07-25 07:54:10.48	\N
4405	400	1646-16	Natey Gm4	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-23 11:12:10.999	\N	\N	\N	{"type":"Natey Gm4","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"Gm4","color":"Smokefired Terra with Terra and bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-07-16T11:07:09.608Z","validated":"2025-07-18T11:23:09.851Z","building":"2025-07-23T11:12:10.998Z"}	f	\N	2025-07-16 09:32:45.408737	2025-07-25 07:54:10.514	\N
4324	358	1604-11	Natey Bbm3	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-08 07:58:26.957	\N	\N	16691001885003	{"type":"Natey Bbm3","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"Bbm3","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{"validated":"2025-07-06T11:33:08.419Z","ordered":"2025-07-06T11:33:09.882Z","building":"2025-07-08T07:58:26.955Z","testing":"2025-07-15T06:34:18.432Z","firing":"2025-07-15T06:34:19.576Z","waxing":"2025-07-15T06:34:21.790Z","tuning1":"2025-07-15T06:34:22.617Z","tuning2":"2025-07-15T06:34:23.723Z","bagging":"2025-07-15T11:27:42.997Z"}	t	Order fulfilled in Shopify	2025-05-21 07:08:04.057583	2025-07-25 07:50:31.895	\N
4321	358	1604-8	Innato Dm4	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-06 11:27:51.497	\N	\N	16691001786699	{"type":"Innato Dm4","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Dm4","color":"Smokefired Terra with Terra and bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-07-06T11:27:47.507Z","dry":"2025-07-06T11:27:49.968Z","building":"2025-07-06T11:27:51.497Z","validated":"2025-07-06T11:27:52.625Z","testing":"2025-07-12T09:07:07.216Z","firing":"2025-07-12T09:07:08.244Z","tuning1":"2025-07-12T09:07:09.362Z","waxing":"2025-07-12T09:07:17.729Z","bagging":"2025-07-15T11:28:38.135Z"}	t	Order fulfilled in Shopify	2025-05-21 07:08:03.758398	2025-07-25 07:50:32.856	\N
4309	353	1546-1	Innato Em3 (NEW)	\N	\N	\N	3	\N	\N	\N	\N	2025-05-19 11:00:29.522	\N	\N	16391832273227	{"type":"Innato Em3 (NEW)","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Em3","color":"Blue, with Terra and Gold Bubbles","key":"432 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-05-15T06:15:33.189Z","validated":"2025-05-15T06:15:40.356Z","building":"2025-05-19T11:00:29.522Z","testing":"2025-06-05T07:19:06.611Z","firing":"2025-06-05T07:19:07.622Z","smoothing":"2025-06-05T07:19:08.497Z","tuning1":"2025-06-05T07:19:09.432Z","waxing":"2025-06-05T07:19:10.380Z","tuning2":"2025-06-07T09:27:59.412Z","bagging":"2025-06-07T19:32:41.196Z","boxing":"2025-06-07T19:32:41.941Z","labeling":"2025-06-08T08:13:51.132Z"}	t	Order fulfilled in Shopify	2025-05-13 14:57:04.390596	2025-07-25 07:50:44.968	test
9	9	1594-2	Innato Am3	\N	\N	\N	\N	\N	\N	\N	\N	2025-05-20 15:18:06.05	\N	\N	16637598433611	{"customBoxSize":"50x50x50","useJointBox":true,"type":"Innato Am3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Am3","color":"Smokefired black with Terra and Copper Bubbles","key":"440 Hz","fulfillable_quantity":"0"}	ordered	0	{}	t	Order fulfilled in Shopify	2025-05-13 14:49:21.254026	2025-07-25 07:50:35.012	\N
4377	389	1636-1	Innato Bm3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"type":"Innato Bm3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Bm3","color":"Blue, with Terra and Gold Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{}	f	\N	2025-06-29 05:52:03.863464	2025-07-25 07:54:11.825	\N
23	13	1590-1	Innato Em4	\N	\N	\N	1.7	\N	\N	\N	\N	2025-06-10 12:50:16.123	\N	\N	16601674613067	{"type":"Innato Em4","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Em4","color":"Blue, with Terra and Gold Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-06-05T14:18:31.924Z","validated":"2025-06-10T12:50:14.280Z","building":"2025-06-10T12:50:16.123Z","testing":"2025-06-30T10:43:22.524Z","firing":"2025-06-30T10:43:23.821Z","smoothing":"2025-06-30T10:43:25.029Z","tuning1":"2025-06-30T10:43:26.097Z","waxing":"2025-06-30T10:43:27.141Z","tuning2":"2025-07-04T07:27:44.260Z","bagging":"2025-07-04T08:12:16.853Z","boxing":"2025-07-04T10:28:42.755Z","labeling":"2025-07-04T10:42:05.081Z"}	t	Order fulfilled in Shopify	2025-05-13 14:49:22.367326	2025-07-25 07:50:36.161	\N
4322	358	1604-9	Innato Gm3	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-06 11:25:43.369	\N	\N	16691001819467	{"type":"Innato Gm3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Gm3","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{"dry":"2025-07-06T11:25:42.191Z","building":"2025-07-06T11:25:43.369Z","validated":"2025-07-06T11:25:44.670Z","ordered":"2025-07-06T11:27:48.598Z","tuning1":"2025-07-12T13:37:30.110Z","testing":"2025-07-12T13:37:30.996Z","firing":"2025-07-12T13:37:31.725Z","waxing":"2025-07-12T13:37:32.506Z","tuning2":"2025-07-12T13:37:33.710Z","bagging":"2025-07-15T11:24:08.666Z"}	t	Order fulfilled in Shopify	2025-05-21 07:08:03.867714	2025-07-25 07:50:32.904	\N
4312	356	1518-1	Double Large Native Am3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"type":"Double Large Native Am3","model":"DOUBLE","fluteType":"DOUBLE","tuningFrequency":"440Hz","frequency":"440","tuning":"Am3","color":"Blue, with Terra and Gold Bubbles","key":"432 Hz","fulfillable_quantity":"0"}	ordered	0	{"ordered":"2025-04-01T15:24:38.952Z"}	t	Automatisch gearchiveerd omdat het item al is fulfilled in Shopify	2025-05-13 14:57:05.392544	2025-05-13 14:57:05.392544	\N
4381	393	1640-1	ZEN flute Large	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"type":"ZEN flute Large","model":"ZEN","fluteType":"ZEN","tuningFrequency":"440Hz","frequency":"440","tuning":"L","color":"Blue, with Terra and Gold Bubbles","fulfillable_quantity":"1"}	ordered	0	{}	f	\N	2025-07-02 19:46:13.92765	2025-07-25 07:54:11.285	\N
4317	358	1604-4	Innato Bm3	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-06 11:18:41.862	\N	\N	16691001655627	{"type":"Innato Bm3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Bm3","color":"Smokefired Terra with Terra and bronze Bubbles","key":"432 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-07-06T11:18:37.602Z","validated":"2025-07-06T11:18:38.928Z","dry":"2025-07-06T11:18:40.767Z","building":"2025-07-06T11:18:41.862Z","firing":"2025-07-06T11:19:06.072Z","waxing":"2025-07-06T11:19:08.891Z","tuning1":"2025-07-06T11:19:09.931Z","testing":"2025-07-06T11:19:11.244Z","bagging":"2025-07-15T11:29:06.052Z"}	t	Order fulfilled in Shopify	2025-05-21 07:08:03.396647	2025-07-25 07:50:32.662	\N
4333	358	1604-19	Double Large Native Am3	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-06 11:21:27.986	\N	\N	16694322594123	{"type":"Double Large Native Am3","model":"DOUBLE","fluteType":"DOUBLE","tuningFrequency":"440Hz","frequency":"440","tuning":"Am3","color":"Smokefired Terra with Terra and bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-07-06T11:21:26.078Z","dry":"2025-07-06T11:21:26.982Z","building":"2025-07-06T11:21:27.986Z","validated":"2025-07-06T11:21:29.420Z","testing":"2025-07-12T13:26:15.737Z","firing":"2025-07-12T13:26:17.097Z","waxing":"2025-07-12T13:26:18.816Z","tuning2":"2025-07-12T13:26:19.760Z","tuning1":"2025-07-12T13:26:20.939Z","bagging":"2025-07-15T11:24:16.649Z"}	t	Order fulfilled in Shopify	2025-05-21 13:30:53.590334	2025-07-25 07:50:32.333	\N
4379	391	1637-1	Innato Am3	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-22 11:24:42.025	\N	\N	\N	{"type":"Innato Am3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Am3","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-07-18T07:16:55.616Z","validated":"2025-07-18T07:16:56.941Z","building":"2025-07-22T11:24:42.024Z"}	f	\N	2025-06-30 12:11:02.788922	2025-07-25 07:54:11.677	\N
25	15	1588-1	Natey G#m4	\N	\N	\N	0.3	\N	\N	\N	\N	2025-06-18 11:54:07.548	\N	\N	16590322794827	{"type":"Natey G#m4","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"G#m4","color":"Smokefired Terra with Terra and bronze Bubbles","key":"432 Hz","fulfillable_quantity":"1"}	ordered	0	{"validated":"2025-06-18T11:54:06.574Z","building":"2025-06-18T11:54:07.548Z","ordered":"2025-07-06T11:23:31.689Z","bagging":"2025-07-15T08:56:19.701Z","testing":"2025-07-15T09:47:09.628Z","firing":"2025-07-15T09:47:10.867Z","boxing":"2025-07-15T09:47:11.872Z","tuning1":"2025-07-15T09:47:12.878Z","tuning2":"2025-07-15T09:47:14.622Z","waxing":"2025-07-15T09:47:15.281Z","labeling":"2025-07-15T11:21:39.721Z"}	t	Order fulfilled in Shopify	2025-05-13 14:49:22.728019	2025-07-25 07:50:36.543	\N
4313	357	1515-1	Double Medium Native Bbm3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"type":"Double Medium Native Bbm3","model":"DOUBLE","fluteType":"DOUBLE","tuningFrequency":"440Hz","frequency":"440","tuning":"Bbm3","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"0"}	ordered	0	{"ordered":"2025-03-29T15:24:38.952Z"}	t	Automatisch gearchiveerd omdat het item al is fulfilled in Shopify	2025-05-13 15:18:48.58601	2025-05-13 15:18:48.58601	\N
4380	392	1638-1	Double Medium Native Cm4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"type":"Double Medium Native Cm4","model":"DOUBLE","fluteType":"DOUBLE","tuningFrequency":"440Hz","frequency":"440","tuning":"Cm4","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{}	f	\N	2025-07-01 17:54:25.18375	2025-07-25 07:54:11.572	\N
4280	330	1580-2	Innato Fm3	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-10 10:26:13.887	\N	\N	16563508478283	{"type":"Innato Fm3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Fm3","color":"Smokefired black with Terra and Copper Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-07-07T10:13:02.303Z","validated":"2025-07-08T07:10:47.181Z","building":"2025-07-10T10:26:13.887Z","firing":"2025-07-15T11:15:47.924Z","testing":"2025-07-15T11:16:09.542Z","tuning1":"2025-07-15T11:16:10.476Z","waxing":"2025-07-15T11:16:11.272Z","tuning2":"2025-07-15T11:16:11.988Z","bagging":"2025-07-15T11:51:42.074Z"}	t	Order fulfilled in Shopify	2025-05-13 14:57:00.344406	2025-07-25 07:50:39.108	\N
4277	328	1583-1	Innato Exploration Cards	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16568669241675	{"type":"Innato Exploration Cards","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","fulfillable_quantity":"1"}	ordered	0	{}	t	Order fulfilled in Shopify	2025-05-13 14:56:59.994741	2025-07-25 07:50:38.638	\N
4318	358	1604-5	Innato Cm4	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-06 11:18:56.894	\N	\N	16691001688395	{"type":"Innato Cm4","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Cm4","color":"Blue, with Terra and Gold Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-07-06T11:18:54.935Z","dry":"2025-07-06T11:18:55.957Z","building":"2025-07-06T11:18:56.894Z","validated":"2025-07-06T11:18:57.977Z","waxing":"2025-07-06T11:19:12.404Z","tuning1":"2025-07-06T11:19:13.572Z","smoothing":"2025-07-06T11:19:14.650Z","firing":"2025-07-06T11:19:15.761Z","testing":"2025-07-06T11:19:17.201Z","bagging":"2025-07-15T11:28:20.586Z"}	t	Order fulfilled in Shopify	2025-05-21 07:08:03.484866	2025-07-25 07:50:32.709	\N
4370	384	1630-8	Innato Dm4	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-16 12:11:35.048	\N	\N	16842507387211	{"type":"Innato Dm4","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Dm4","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{}	f	\N	2025-06-24 10:49:28.543522	2025-07-25 07:50:22.894	\N
4289	339	1571-1	Innato Dm4	\N	\N	\N	1.8	\N	\N	\N	\N	2025-05-13 18:08:02.659	\N	\N	16494827569483	{"type":"Innato Dm4","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Dm4","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-05-13T15:24:38.952Z","validated":"2025-05-13T18:08:01.187Z","dry":"2025-05-13T18:08:01.925Z","building":"2025-05-13T18:08:02.659Z","testing":"2025-05-14T12:42:00.880Z","firing":"2025-05-14T12:42:01.806Z","tuning1":"2025-05-17T11:27:13.825Z","waxing":"2025-05-17T11:27:14.615Z","tuning2":"2025-05-17T11:27:15.482Z","bagging":"2025-05-17T12:31:51.306Z","boxing":"2025-05-17T12:31:52.220Z","labeling":"2025-05-17T12:59:40.869Z"}	t	Order fulfilled in Shopify	2025-05-13 14:57:01.713752	2025-07-25 07:50:41.073	\N
4382	394	1639-1	ZEN flute Medium	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"type":"ZEN flute Medium","model":"ZEN","fluteType":"ZEN","tuningFrequency":"440Hz","frequency":"440","tuning":"M","color":"Smokefired Terra and Black","fulfillable_quantity":"1"}	ordered	0	{"dry":"2025-07-24T13:05:20.509Z"}	f	\N	2025-07-02 19:46:14.3345	2025-07-25 07:54:11.434	\N
4406	401	1647-1	Innato Em4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"type":"Innato Em4","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Em4","color":"Blue, with Terra and Gold Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{}	f	\N	2025-07-17 14:10:01.562405	2025-07-25 07:54:10.143	\N
4360	381	1627-1	Innato Am3	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-17 09:53:08.779	\N	\N	16832614039883	{"type":"Innato Am3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Am3","color":"Smokefired Blue with Red and Bronze Bubbles","key":"432 Hz","fulfillable_quantity":"1"}	ordered	0	{}	f	\N	2025-06-21 21:39:26.042452	2025-07-25 07:50:24.525	\N
4338	362	1609-1	Innato Em4	\N	\N	\N	1,5	\N	\N	\N	\N	2025-07-06 11:21:10.78	\N	\N	16707772252491	{"type":"Innato Em4","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Em4","color":"Smokefired black with Terra and Copper Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-07-06T11:21:08.701Z","dry":"2025-07-06T11:21:09.808Z","building":"2025-07-06T11:21:10.780Z","validated":"2025-07-06T11:21:11.957Z","firing":"2025-07-12T09:01:57.883Z","testing":"2025-07-12T09:01:58.918Z","tuning1":"2025-07-12T09:02:10.912Z","waxing":"2025-07-12T09:02:19.192Z","bagging":"2025-07-15T08:21:20.314Z","boxing":"2025-07-15T08:21:20.825Z","tuning2":"2025-07-15T11:16:49.789Z","labeling":"2025-07-15T11:32:35.187Z"}	t	Order fulfilled in Shopify	2025-05-25 10:30:41.57261	2025-07-25 07:50:30.811	\N
4357	378	1624-1	Innato Bbm3	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-16 13:25:21.314	\N	\N	16807369670987	{"type":"Innato Bbm3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Bbm3","color":"Blue, with Terra and Gold Bubbles","key":"432 Hz","fulfillable_quantity":"1"}	ordered	0	{}	f	\N	2025-06-16 11:24:20.676124	2025-07-25 07:50:25.658	\N
4282	332	1578-1	Innato C#m4	\N	\N	\N	1.9	\N	\N	\N	\N	2025-05-23 13:36:03.053	\N	\N	16550977012043	{"type":"Innato C#m4","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"C#m4","color":"Blue, with Terra and Gold Bubbles","key":"432 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-05-22T12:27:26.092Z","validated":"2025-05-22T12:27:27.076Z","building":"2025-05-23T13:36:03.053Z","testing":"2025-06-04T08:46:33.269Z","firing":"2025-06-04T09:33:55.306Z","smoothing":"2025-06-04T09:33:58.070Z","tuning1":"2025-06-04T09:33:59.026Z","waxing":"2025-06-04T09:34:00.215Z","tuning2":"2025-06-07T09:29:23.054Z","bagging":"2025-06-07T19:45:56.193Z","boxing":"2025-06-07T19:45:58.556Z","labeling":"2025-06-08T08:17:50.431Z"}	t	Order fulfilled in Shopify	2025-05-13 14:57:00.633426	2025-07-25 07:50:39.491	\N
4310	354	1537-1	Innato Am3	\N	\N	\N	2.3	\N	\N	\N	\N	2025-05-20 13:45:40.054	\N	\N	16317989617995	{"type":"Innato Am3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Am3","color":"Blue, with Terra and Gold Bubbles","key":"440 Hz","fulfillable_quantity":"1","bagType":"Innato","bagSize":"L","Bag Type":"Innato","Bag Size":"L","bag type":"Innato","bag size":"L"}	ordered	0	{"validated":"2025-05-15T06:09:44.354Z","ordered":"2025-05-15T08:00:53.435Z","building":"2025-05-20T13:45:40.054Z","testing":"2025-06-04T08:50:47.322Z","firing":"2025-06-04T09:08:34.026Z","smoothing":"2025-06-04T09:08:34.900Z","waxing":"2025-06-04T09:08:36.240Z","tuning1":"2025-06-04T09:08:37.455Z","tuning2":"2025-06-07T09:32:31.815Z","bagging":"2025-06-07T19:41:50.564Z","boxing":"2025-06-07T19:41:51.111Z","labeling":"2025-06-08T08:12:57.615Z"}	t	Order fulfilled in Shopify	2025-05-13 14:57:04.783982	2025-07-25 07:50:45.541	Gggg
4284	334	1576-1	Natey Am4	\N	\N	\N	.4	\N	\N	\N	\N	2025-05-24 10:04:40.595	\N	\N	16537558319435	{"type":"Natey Am4","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"Am4","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-05-22T12:02:40.722Z","validated":"2025-05-22T12:02:45.600Z","building":"2025-05-24T10:04:40.595Z","testing":"2025-06-05T07:22:37.925Z","firing":"2025-06-06T14:08:57.731Z","tuning1":"2025-06-06T14:09:02.923Z","waxing":"2025-06-06T14:09:10.889Z","tuning2":"2025-06-06T14:09:11.422Z","bagging":"2025-06-07T19:49:51.255Z","boxing":"2025-06-07T19:49:51.799Z","labeling":"2025-06-08T08:16:12.314Z"}	t	Order fulfilled in Shopify	2025-05-13 14:57:00.938974	2025-07-25 07:50:39.875	\N
4407	402	1648-1	Innato Em4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"type":"Innato Em4","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Em4","color":"Blue, with Terra and Gold Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{}	f	\N	2025-07-20 08:55:06.552565	2025-07-25 07:54:10.006	\N
4334	358	1604-20	Double Medium Native Cm4	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-06 11:26:22.898	\N	\N	16694322626891	{"type":"Double Medium Native Cm4","model":"DOUBLE","fluteType":"DOUBLE","tuningFrequency":"440Hz","frequency":"440","tuning":"Cm4","color":"Smokefired black with Terra and Copper Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-07-06T11:26:20.542Z","dry":"2025-07-06T11:26:21.587Z","building":"2025-07-06T11:26:22.898Z","validated":"2025-07-06T11:26:24.273Z","testing":"2025-07-12T13:38:39.819Z","firing":"2025-07-12T13:38:40.852Z","tuning1":"2025-07-12T13:38:42.815Z","waxing":"2025-07-12T13:38:44.320Z","tuning2":"2025-07-12T13:38:45.171Z","bagging":"2025-07-15T11:24:53.830Z"}	t	Order fulfilled in Shopify	2025-05-21 13:30:53.714064	2025-07-25 07:50:32.428	\N
4384	396	1642-1	Innato Dm4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"type":"Innato Dm4","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Dm4","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{}	f	\N	2025-07-04 08:03:56.09337	2025-07-25 07:54:11.084	\N
4351	372	1618-1	Innato C#m4	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-16 08:31:05.187	\N	\N	16769546846539	{"type":"Innato C#m4","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"C#m4","color":"Blue, with Terra and Gold Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{"validated":"2025-07-09T13:10:41.517Z","building":"2025-07-16T08:31:05.187Z","ordered":"2025-07-16T11:59:27.972Z"}	f	\N	2025-06-07 19:04:08.057244	2025-07-25 07:50:27.898	\N
7	8	1595-1	Natey G#m4	\N	\N	\N	0.3	\N	\N	\N	\N	2025-06-24 11:44:39.299	\N	\N	16643297050955	{"type":"Natey G#m4","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"G#m4","color":"Smokefired Terra with Terra and bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-06-18T11:52:32.291Z","validated":"2025-06-24T11:44:37.862Z","building":"2025-06-24T11:44:39.299Z","bagging":"2025-07-15T08:06:36.273Z","boxing":"2025-07-15T08:06:36.680Z","firing":"2025-07-15T09:47:17.155Z","testing":"2025-07-15T09:47:17.681Z","tuning1":"2025-07-15T09:47:19.138Z","waxing":"2025-07-15T09:47:19.722Z","tuning2":"2025-07-15T09:47:20.304Z","labeling":"2025-07-15T11:22:32.439Z"}	t	Order fulfilled in Shopify	2025-05-13 14:49:21.056189	2025-07-25 07:50:34.636	\N
4362	383	1628-1	Innato Bbm3	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-17 08:40:51.264	\N	\N	16840737751371	{"type":"Innato Bbm3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Bbm3","color":"Blue, with Terra and Gold Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{}	f	\N	2025-06-24 08:26:40.111888	2025-07-25 07:50:24.055	\N
4375	387	1634-1	Innato G#m3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"type":"Innato G#m3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"G#m3","color":"Smokefired black with Terra and Copper Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{}	f	\N	2025-06-27 15:12:50.082439	2025-07-25 07:54:12.123	\N
2	3	1600-1	Natey Am4	\N	\N	\N	\N	\N	\N	\N	\N	2025-06-24 11:34:10.488	\N	\N	16665201705291	{"type":"Natey Am4","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"Am4","color":"Blue, with Terra and Gold Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-06-18T13:37:47.705Z","validated":"2025-06-18T13:37:48.722Z","building":"2025-06-24T11:34:10.488Z","testing":"2025-07-10T13:57:56.855Z","firing":"2025-07-10T13:57:57.504Z","smoothing":"2025-07-10T13:57:58.421Z","tuning1":"2025-07-10T13:57:59.758Z"}	t	Order fulfilled in Shopify	2025-05-13 14:49:20.169517	2025-07-25 07:50:33.394	\N
4355	376	1622-1	Innato Bbm3	\N	\N	\N	2.0	\N	\N	\N	\N	2025-07-15 09:48:07.915	\N	\N	16798170939723	{"type":"Innato Bbm3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Bbm3","color":"Smokefired Terra with Terra and bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{"bagging":"2025-07-15T08:41:14.654Z","boxing":"2025-07-15T08:41:15.156Z","ordered":"2025-07-15T09:48:05.747Z","validated":"2025-07-15T09:48:06.404Z","dry":"2025-07-15T09:48:07.316Z","building":"2025-07-15T09:48:07.915Z","testing":"2025-07-15T09:48:08.741Z","firing":"2025-07-15T09:48:09.975Z","tuning1":"2025-07-15T09:48:10.715Z","waxing":"2025-07-15T09:48:12.008Z","tuning2":"2025-07-15T09:48:12.633Z","labeling":"2025-07-15T11:19:49.124Z"}	t	Order fulfilled in Shopify	2025-06-14 13:10:08.595174	2025-07-25 07:50:26.27	\N
11	9	1594-4	Innato Bbm3	\N	\N	\N	\N	\N	\N	\N	\N	2025-06-06 13:33:59.248	\N	\N	16637598499147	{"customBoxSize":"50x50x50","useJointBox":true,"type":"Innato Bbm3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Bbm3","color":"Smokefired black with Terra and Copper Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-06-06T13:33:48.646Z","validated":"2025-06-06T13:33:50.280Z","dry":"2025-06-06T13:33:54.509Z","building":"2025-06-06T13:33:59.248Z","firing":"2025-06-06T13:34:07.587Z","testing":"2025-06-06T13:34:08.634Z","tuning1":"2025-06-06T13:34:09.846Z","waxing":"2025-06-06T13:34:10.873Z","tuning2":"2025-06-07T09:40:46.122Z","boxing":"2025-06-08T07:59:22.312Z","bagging":"2025-06-08T07:59:30.772Z","labeling":"2025-06-08T08:43:24.866Z"}	t	Order fulfilled in Shopify	2025-05-13 14:49:21.329991	2025-07-25 07:50:35.106	\N
4311	355	1535-1	Innato Exploration Cards	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"type":"Innato Exploration Cards","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","fulfillable_quantity":"1"}	archived	0	{"ordered":"2025-04-18T15:24:38.952Z","validated":"2025-04-21T15:24:38.952Z","building":"2025-04-24T15:24:38.952Z","testing":"2025-04-27T15:24:38.952Z","terrasigillata":"2025-04-30T15:24:38.952Z","firing":"2025-05-03T15:24:38.952Z","smokefiring":"2025-05-06T15:24:38.952Z","tuning1":"2025-05-09T15:24:38.952Z","tuning2":"2025-05-12T15:24:38.952Z","quality_check":"2025-05-15T15:24:38.952Z","ready":"2025-05-18T15:24:38.952Z","shipping":"2025-05-21T15:24:38.952Z","delivered":"2025-05-24T15:24:38.952Z","archived":"2025-05-27T15:24:38.952Z"}	t	Order fulfilled in Shopify	2025-05-13 14:57:04.955903	2025-07-25 07:50:45.775	\N
28	2	1601-1	Natey F#m4	\N	\N	\N	0.4	\N	\N	\N	\N	2025-06-24 11:02:05.529	\N	\N	16667050344779	{"type":"Natey F#m4","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"F#m4","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-06-18T13:42:02.883Z","validated":"2025-06-18T13:43:08.575Z","building":"2025-06-24T11:02:05.528Z","testing":"2025-07-12T13:35:46.395Z","firing":"2025-07-12T13:35:47.353Z","tuning1":"2025-07-12T13:35:48.352Z","tuning2":"2025-07-12T13:35:52.420Z","bagging":"2025-07-15T07:57:10.802Z","boxing":"2025-07-15T07:57:11.150Z","waxing":"2025-07-15T09:48:34.360Z","labeling":"2025-07-15T11:29:21.155Z"}	t	Order fulfilled in Shopify	2025-05-13 14:49:24.07581	2025-07-25 07:50:33.187	\N
4376	388	1633-1	Innato G#m3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"type":"Innato G#m3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"G#m3","color":"Smokefired Blue with Red and Bronze Bubbles","key":"432 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-07-24T13:37:32.371Z"}	f	\N	2025-06-27 15:12:50.487029	2025-07-25 07:54:12.26	\N
4374	386	1632-2	Natey Dm4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"type":"Natey Dm4","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"Dm4","color":"Smokefired black with Terra and Copper Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-07-24T13:26:30.019Z","validated":"2025-07-24T13:26:32.586Z"}	f	\N	2025-06-26 05:58:50.541461	2025-07-25 07:54:12.425	\N
4336	360	1606-1	Innato Am3	\N	\N	\N	2.0	\N	\N	\N	\N	2025-07-06 11:26:09.684	\N	\N	16703125946699	{"type":"Innato Am3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Am3","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-07-06T11:26:07.162Z","dry":"2025-07-06T11:26:08.486Z","building":"2025-07-06T11:26:09.684Z","validated":"2025-07-06T11:26:10.787Z","testing":"2025-07-12T08:08:53.001Z","firing":"2025-07-12T08:08:54.566Z","tuning1":"2025-07-12T08:44:25.718Z","waxing":"2025-07-12T08:44:27.354Z","bagging":"2025-07-15T08:10:37.430Z","boxing":"2025-07-15T08:10:38.089Z","tuning2":"2025-07-15T11:16:59.222Z","labeling":"2025-07-15T11:31:02.904Z"}	t	Order fulfilled in Shopify	2025-05-24 04:03:01.605968	2025-07-25 07:50:31.421	\N
4372	385	1631-1	Innato Bm3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16843095572811	{"type":"Innato Bm3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Bm3","color":"Smokefired black with Terra and Copper Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{}	f	\N	2025-06-24 17:09:50.890337	2025-07-25 07:50:21.854	\N
4347	369	1615-1	Innato Am3	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-14 14:20:43.601	\N	\N	16739224912203	{"type":"Innato Am3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Am3","color":"Smokefired black with Terra and Copper Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-07-07T14:07:44.519Z","validated":"2025-07-08T09:43:27.486Z","building":"2025-07-14T14:20:43.601Z"}	f	\N	2025-06-03 07:21:52.659122	2025-07-25 07:50:29.014	\N
4314	358	1604-1	Innato Am3	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-06 11:20:26.107	\N	\N	16691001557323	{"type":"Innato Am3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Am3","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{"dry":"2025-07-06T11:20:25.051Z","building":"2025-07-06T11:20:26.107Z","validated":"2025-07-06T11:20:27.367Z","ordered":"2025-07-06T11:20:28.484Z","testing":"2025-07-12T08:08:18.901Z","firing":"2025-07-12T08:08:20.039Z","tuning1":"2025-07-12T08:27:30.445Z","waxing":"2025-07-15T10:09:07.398Z","bagging":"2025-07-15T11:23:54.813Z"}	t	Order fulfilled in Shopify	2025-05-21 07:08:03.096898	2025-07-25 07:50:31.796	\N
13	9	1594-6	Innato Bm3	\N	\N	\N	\N	\N	\N	\N	\N	2025-05-23 14:25:36.845	\N	\N	16637598564683	{"customBoxSize":"50x50x50","useJointBox":true,"type":"Innato Bm3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Bm3","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"0"}	ordered	0	{}	t	Order fulfilled in Shopify	2025-05-13 14:49:21.41942	2025-07-25 07:50:35.199	\N
4283	333	1577-1	Innato Em4	\N	\N	\N	1.8	\N	\N	\N	\N	2025-05-17 11:46:28.647	\N	\N	16538871071051	{"type":"Innato Em4","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Em4","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-05-17T11:46:26.248Z","validated":"2025-05-17T11:46:27.085Z","dry":"2025-05-17T11:46:27.879Z","building":"2025-05-17T11:46:28.647Z","testing":"2025-05-17T11:46:29.384Z","tuning1":"2025-05-17T11:46:30.825Z","waxing":"2025-05-17T11:46:31.605Z","firing":"2025-05-17T11:46:32.299Z","tuning2":"2025-05-17T11:46:32.969Z","bagging":"2025-05-17T12:31:25.652Z","boxing":"2025-05-17T12:31:26.701Z","labeling":"2025-05-17T12:43:06.159Z"}	t	Order fulfilled in Shopify	2025-05-13 14:57:00.787884	2025-07-25 07:50:39.682	\N
20	10	1593-1	Innato Gm3	\N	\N	\N	2.5	\N	\N	\N	\N	2025-06-20 09:52:35.933	\N	\N	16634801291595	{"type":"Innato Gm3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Gm3","color":"Smokefired Terra with Terra and bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-06-18T11:48:57.219Z","validated":"2025-06-19T07:23:49.003Z","building":"2025-06-20T09:52:35.933Z","testing":"2025-07-06T11:06:56.638Z","firing":"2025-07-07T08:04:59.323Z","tuning1":"2025-07-07T08:05:00.023Z","waxing":"2025-07-07T08:05:00.671Z","bagging":"2025-07-09T11:11:35.051Z","boxing":"2025-07-09T11:11:35.568Z","labeling":"2025-07-09T14:36:28.302Z"}	t	Order fulfilled in Shopify	2025-05-13 14:49:21.84004	2025-07-25 07:50:35.529	\N
4307	351	1553-1	Natey Gm3	\N	\N	\N	.6	\N	\N	\N	\N	2025-05-13 18:06:53.71	\N	\N	16451904012619	{"type":"Natey Gm3","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"Gm3","color":"Smokefired Terra with Terra and bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1","bagType":"Natey","bagSize":"L","Bag Type":"Natey","Bag Size":"L","bag type":"Natey","bag size":"L","boxSize":"12x12x30","Box Size":"12x12x30","box size":"12x12x30"}	ordered	0	{"ordered":"2025-05-06T15:24:38.952Z","validated":"2025-05-13T18:03:58.142Z","dry":"2025-05-13T18:06:52.644Z","building":"2025-05-13T18:06:53.710Z","testing":"2025-05-14T12:41:42.256Z","firing":"2025-05-15T06:16:04.740Z","tuning1":"2025-05-17T11:32:55.129Z","waxing":"2025-05-17T11:32:55.933Z","tuning2":"2025-05-17T11:32:56.590Z","bagging":"2025-05-17T12:30:55.538Z","boxing":"2025-05-17T12:30:56.258Z","labeling":"2025-05-17T12:48:23.856Z"}	t	Order fulfilled in Shopify	2025-05-13 14:57:03.96043	2025-07-25 07:50:44.349	\N
4363	384	1630-1	Innato Am3	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-21 10:11:40.907	\N	\N	16842507157835	{"type":"Innato Am3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Am3","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{}	f	\N	2025-06-24 10:49:27.879174	2025-07-25 07:50:22.233	\N
4339	363	1608-1	Innato Exploration Cards	\N	\N	\N	0.9	\N	\N	\N	\N	2025-07-15 06:52:22.501	\N	\N	16707676078411	{"type":"Innato Exploration Cards","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-07-15T06:52:02.922Z","validated":"2025-07-15T06:52:03.907Z","dry":"2025-07-15T06:52:05.957Z","testing":"2025-07-15T06:52:08.030Z","tuning2":"2025-07-15T06:52:11.435Z","waxing":"2025-07-15T06:52:12.533Z","smoothing":"2025-07-15T06:52:15.523Z","firing":"2025-07-15T06:52:17.955Z","tuning1":"2025-07-15T06:52:20.752Z","building":"2025-07-15T06:52:22.501Z","bagging":"2025-07-15T09:10:11.348Z","boxing":"2025-07-15T09:10:11.908Z","labeling":"2025-07-15T11:31:16.588Z"}	t	Order fulfilled in Shopify	2025-05-25 10:30:41.964165	2025-07-25 07:50:31	\N
4325	358	1604-12	Natey Bbm3	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-06 11:21:44.917	\N	\N	16691001917771	{"type":"Natey Bbm3","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"Bbm3","color":"Smokefired black with Terra and Copper Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-07-06T11:21:43.031Z","dry":"2025-07-06T11:21:43.985Z","building":"2025-07-06T11:21:44.917Z","validated":"2025-07-06T11:21:46.501Z","firing":"2025-07-12T13:36:44.479Z","tuning1":"2025-07-12T13:36:45.222Z","testing":"2025-07-12T13:36:46.258Z","waxing":"2025-07-12T13:36:47.082Z","tuning2":"2025-07-12T13:36:47.863Z","bagging":"2025-07-15T11:27:31.468Z"}	t	Order fulfilled in Shopify	2025-05-21 07:08:04.144318	2025-07-25 07:50:31.943	\N
4345	367	1612-1	Innato Dm4	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-14 13:27:19.702	\N	\N	16723416383819	{"type":"Innato Dm4","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Dm4","color":"Blue, with Terra and Gold Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-07-06T13:47:00.665Z","validated":"2025-07-08T07:10:28.714Z","building":"2025-07-14T13:27:19.702Z"}	f	\N	2025-05-30 05:39:11.750203	2025-07-25 07:50:30.196	\N
4327	358	1604-14	Natey Em3	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-06 12:07:34.179	\N	\N	16691001983307	{"type":"Natey Em3","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"Em3","color":"Smokefired black with Terra and Copper Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-07-06T11:35:34.750Z","validated":"2025-07-06T11:35:35.844Z","building":"2025-07-06T12:07:34.179Z","testing":"2025-07-15T09:22:30.442Z","firing":"2025-07-15T09:22:31.446Z","tuning1":"2025-07-15T09:22:32.411Z","waxing":"2025-07-15T09:22:33.815Z","tuning2":"2025-07-15T09:22:53.120Z","bagging":"2025-07-15T11:27:51.757Z"}	t	Order fulfilled in Shopify	2025-05-21 07:08:04.328694	2025-07-25 07:50:32.037	\N
4346	368	1611-1	Natey Cm4	\N	\N	\N	0.5	\N	\N	\N	\N	2025-07-07 15:07:31.985	\N	\N	16721416552779	{"type":"Natey Cm4","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"Cm4","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-07-06T11:30:13.500Z","validated":"2025-07-06T11:30:14.599Z","building":"2025-07-07T15:07:31.985Z","testing":"2025-07-15T06:50:33.929Z","firing":"2025-07-15T06:50:34.994Z","tuning1":"2025-07-15T06:50:36.053Z","waxing":"2025-07-15T06:50:37.349Z","tuning2":"2025-07-15T06:50:38.113Z","boxing":"2025-07-15T07:54:31.159Z","bagging":"2025-07-15T07:54:32.042Z","labeling":"2025-07-15T11:34:24.402Z"}	t	Order fulfilled in Shopify	2025-05-30 05:39:12.127797	2025-07-25 07:50:30.385	\N
4343	365	1614-1	Innato Cm4	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-14 13:27:06.139	\N	\N	16724780450123	{"type":"Innato Cm4","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Cm4","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-07-07T12:04:42.866Z","validated":"2025-07-08T10:25:17.287Z","building":"2025-07-14T13:27:06.138Z"}	f	\N	2025-05-30 05:39:10.960841	2025-07-25 07:50:29.352	\N
4342	364	1610-2	Natey G#m4	\N	\N	\N	0.7	\N	\N	\N	\N	2025-07-07 13:50:13.622	\N	\N	16711286522187	{"type":"Natey G#m4","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"G#m4","color":"Smokefired Terra with Terra and bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-07-06T11:30:25.958Z","validated":"2025-07-06T11:30:26.924Z","building":"2025-07-07T13:50:13.621Z","tuning1":"2025-07-12T13:34:25.966Z","firing":"2025-07-12T13:34:26.835Z","testing":"2025-07-12T13:34:27.713Z","waxing":"2025-07-12T13:34:29.564Z","tuning2":"2025-07-12T13:34:30.416Z","bagging":"2025-07-15T08:59:57.773Z","boxing":"2025-07-15T08:59:58.441Z","labeling":"2025-07-15T11:33:22.819Z"}	t	Order fulfilled in Shopify	2025-05-26 06:49:04.883921	2025-07-25 07:50:30.62	\N
18	9	1594-11	Innato Dm4	\N	\N	\N	\N	\N	\N	\N	\N	2025-06-05 07:23:04.774	\N	\N	16637598728523	{"customBoxSize":"50x50x50","useJointBox":true,"type":"Innato Dm4","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Dm4","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-06-05T07:23:01.242Z","validated":"2025-06-05T07:23:02.665Z","dry":"2025-06-05T07:23:03.816Z","building":"2025-06-05T07:23:04.774Z","testing":"2025-06-05T07:23:06.124Z","firing":"2025-06-05T13:33:14.245Z","tuning1":"2025-06-05T13:33:16.409Z","waxing":"2025-06-05T13:33:16.948Z","tuning2":"2025-06-07T09:40:52.294Z","bagging":"2025-06-08T07:59:33.706Z","boxing":"2025-06-08T07:59:35.910Z","labeling":"2025-06-08T08:43:28.564Z"}	t	Order fulfilled in Shopify	2025-05-13 14:49:21.633817	2025-07-25 07:50:34.917	\N
4341	364	1610-1	Natey C#m4	\N	\N	\N	0.7	\N	\N	\N	\N	2025-07-07 14:49:37.379	\N	\N	16711286489419	{"type":"Natey C#m4","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"C#m4","color":"Smokefired black with Terra and Copper Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-07-06T11:33:27.365Z","validated":"2025-07-06T11:33:45.510Z","building":"2025-07-07T14:49:37.379Z","testing":"2025-07-15T06:47:35.431Z","firing":"2025-07-15T06:47:36.361Z","tuning1":"2025-07-15T06:47:37.145Z","waxing":"2025-07-15T06:47:38.188Z","tuning2":"2025-07-15T06:47:39.395Z","bagging":"2025-07-15T08:59:57.525Z","boxing":"2025-07-15T08:59:58.133Z","labeling":"2025-07-15T11:33:19.819Z"}	t	Order fulfilled in Shopify	2025-05-26 06:49:04.784985	2025-07-25 07:50:30.573	\N
4320	358	1604-7	Innato Dm4	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-06 11:19:52.176	\N	\N	16691001753931	{"type":"Innato Dm4","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Dm4","color":"Blue, with Terra and Gold Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-07-06T11:19:47.845Z","validated":"2025-07-06T11:19:49.003Z","dry":"2025-07-06T11:19:51.009Z","building":"2025-07-06T11:19:52.176Z","testing":"2025-07-10T14:10:41.219Z","firing":"2025-07-10T14:10:41.746Z","smoothing":"2025-07-10T14:10:42.342Z","tuning1":"2025-07-10T14:10:46.126Z","waxing":"2025-07-12T09:07:16.858Z","bagging":"2025-07-15T11:24:01.762Z"}	t	Order fulfilled in Shopify	2025-05-21 07:08:03.664593	2025-07-25 07:50:32.803	\N
4308	352	1548-1	Innato Am3	\N	\N	\N	2.2	\N	\N	\N	\N	2025-05-13 18:03:50.591	\N	\N	16396443451723	{"type":"Innato Am3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Am3","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1","boxSize":"35x35x35","Box Size":"35x35x35","box size":"35x35x35"}	ordered	0	{"ordered":"2025-05-01T15:24:38.952Z","validated":"2025-05-13T18:03:49.244Z","dry":"2025-05-13T18:03:49.945Z","building":"2025-05-13T18:03:50.591Z","testing":"2025-05-14T12:41:40.190Z","firing":"2025-05-14T12:41:41.337Z","tuning1":"2025-05-17T11:28:57.889Z","waxing":"2025-05-17T11:28:59.018Z","tuning2":"2025-05-17T11:28:59.863Z","bagging":"2025-05-17T12:31:40.303Z","boxing":"2025-05-17T12:31:41.435Z","labeling":"2025-05-17T12:38:28.711Z"}	t	Order fulfilled in Shopify	2025-05-13 14:57:04.208334	2025-07-25 07:50:44.732	\N
4344	366	1613-1	Innato D#m4	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-16 11:17:57.39	\N	\N	16723463799115	{"type":"Innato D#m4","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"D#m4","color":"Smokefired black with Terra and Copper Bubbles","key":"432 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-07-07T08:54:00.064Z","validated":"2025-07-08T09:30:22.678Z","building":"2025-07-16T11:17:57.390Z"}	f	\N	2025-05-30 05:39:11.369867	2025-07-25 07:50:29.772	\N
4335	358	1604-21	Double Large Native Gm3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16694322659659	{"type":"Double Large Native Gm3","model":"DOUBLE","fluteType":"DOUBLE","tuningFrequency":"440Hz","frequency":"440","tuning":"Gm3","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{}	t	Order fulfilled in Shopify	2025-05-21 13:30:53.850702	2025-07-25 07:50:32.475	\N
16	9	1594-9	Innato Cm4	\N	\N	\N	\N	\N	\N	\N	\N	2025-05-23 08:48:28.936	\N	\N	16637598662987	{"customBoxSize":"50x50x50","useJointBox":true,"type":"Innato Cm4","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Cm4","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"0"}	ordered	0	{}	t	Order fulfilled in Shopify	2025-05-13 14:49:21.550996	2025-07-25 07:50:35.341	\N
4323	358	1604-10	Innato Gm3	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-06 13:57:53.812	\N	\N	16691001852235	{"type":"Innato Gm3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Gm3","color":"Smokefired black with Terra and Copper Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-07-06T11:29:54.670Z","validated":"2025-07-06T11:29:55.843Z","building":"2025-07-06T13:57:53.812Z","testing":"2025-07-15T09:19:23.540Z","firing":"2025-07-15T09:19:25.243Z","tuning1":"2025-07-15T09:19:26.565Z","waxing":"2025-07-15T09:19:27.835Z","tuning2":"2025-07-15T09:19:28.845Z","bagging":"2025-07-15T11:28:29.856Z"}	t	Order fulfilled in Shopify	2025-05-21 07:08:03.964202	2025-07-25 07:50:31.845	\N
4385	397	1643-1	Natey Am4	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-23 09:27:40.652	\N	\N	\N	{"type":"Natey Am4","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"Am4","color":"Blue, with Terra and Gold Bubbles","key":"432 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-07-15T14:17:22.109Z","validated":"2025-07-18T11:40:51.854Z","building":"2025-07-23T09:27:40.652Z"}	f	\N	2025-07-06 09:14:14.559032	2025-07-25 07:54:10.943	\N
4356	377	1623-1	Natey G#m4	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-23 09:38:51.392	\N	\N	16803239461195	{"type":"Natey G#m4","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"G#m4","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-07-15T13:36:58.525Z","validated":"2025-07-15T13:36:59.261Z","building":"2025-07-23T09:38:51.392Z"}	f	\N	2025-06-16 07:17:28.823254	2025-07-25 07:50:26.082	\N
10	9	1594-3	Innato Bbm3	\N	\N	\N	\N	\N	\N	\N	\N	2025-06-05 07:23:41.573	\N	\N	16637598466379	{"customBoxSize":"50x50x50","useJointBox":true,"type":"Innato Bbm3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Bbm3","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-06-05T07:23:37.807Z","dry":"2025-06-05T07:23:40.686Z","building":"2025-06-05T07:23:41.573Z","validated":"2025-06-05T07:23:42.491Z","testing":"2025-06-05T07:23:44.472Z","firing":"2025-06-05T13:40:13.062Z","tuning1":"2025-06-05T13:40:14.311Z","waxing":"2025-06-05T13:40:15.019Z","tuning2":"2025-06-07T09:40:45.105Z","boxing":"2025-06-08T07:59:21.343Z","bagging":"2025-06-08T07:59:29.939Z","labeling":"2025-06-08T08:43:24.131Z"}	t	Order fulfilled in Shopify	2025-05-13 14:49:21.290852	2025-07-25 07:50:35.059	\N
4297	347	1561-1	Innato Bm3	\N	\N	\N	2	\N	\N	\N	\N	2025-05-13 18:07:28.906	\N	\N	16479462719819	{"type":"Innato Bm3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Bm3","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-05-13T15:24:38.952Z","validated":"2025-05-13T18:07:27.160Z","dry":"2025-05-13T18:07:28.125Z","building":"2025-05-13T18:07:28.906Z","testing":"2025-05-14T12:41:44.028Z","firing":"2025-05-14T12:41:49.380Z","tuning1":"2025-05-17T11:28:14.848Z","waxing":"2025-05-17T11:28:15.635Z","tuning2":"2025-05-17T11:28:16.338Z","bagging":"2025-05-17T11:55:27.918Z","boxing":"2025-05-17T11:55:29.762Z","labeling":"2025-05-17T12:51:00.839Z"}	t	Order fulfilled in Shopify	2025-05-13 14:57:03.080574	2025-07-25 07:50:43.103	\N
3	4	1599-1	Natey Am4	\N	\N	\N	0.3	\N	\N	\N	\N	2025-06-24 12:20:20.034	\N	\N	16661413200203	{"type":"Natey Am4","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"Am4","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-06-18T13:34:32.813Z","validated":"2025-06-18T13:34:54.769Z","building":"2025-06-24T12:20:20.033Z","testing":"2025-07-12T09:06:16.734Z","firing":"2025-07-12T09:06:17.892Z","tuning1":"2025-07-12T09:06:18.923Z","waxing":"2025-07-12T09:06:19.908Z","tuning2":"2025-07-12T09:06:21.039Z"}	t	Order fulfilled in Shopify	2025-05-13 14:49:20.345387	2025-07-25 07:50:33.638	\N
4302	349	1559-1	Innato Am3	\N	\N	\N	7.6	\N	\N	\N	\N	2025-05-20 08:04:12.926	\N	\N	16479365464395	{"type":"Innato Am3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Am3","color":"Blue, with Terra and Gold Bubbles","key":"440 Hz","fulfillable_quantity":"1","boxSize":"35x35x35","Box Size":"35x35x35","box size":"35x35x35","bagType":"Innato","bagSize":"XL","Bag Type":"Innato","Bag Size":"XL","bag type":"Innato","bag size":"XL"}	ordered	0	{"ordered":"2025-05-15T08:43:10.488Z","validated":"2025-05-15T11:01:50.216Z","building":"2025-05-20T08:04:12.926Z","tuning1":"2025-06-04T10:04:54.390Z","testing":"2025-06-06T13:27:24.316Z","firing":"2025-06-06T13:27:25.282Z","smoothing":"2025-06-06T13:27:26.585Z","waxing":"2025-06-06T13:27:28.031Z","tuning2":"2025-06-07T09:25:45.951Z","bagging":"2025-07-09T11:05:36.364Z","boxing":"2025-07-09T11:05:36.820Z","labeling":"2025-07-09T14:35:18.886Z"}	t	Order fulfilled in Shopify	2025-05-13 14:57:03.480637	2025-07-25 07:50:43.63	Gggg
4337	361	1607-1	Natey F#m4	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-06 09:52:17.303	\N	\N	16705063846219	{"type":"Natey F#m4","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"F#m4","color":"Blue, with Terra and Gold Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-07-06T09:52:08.804Z","validated":"2025-07-06T09:52:09.968Z","dry":"2025-07-06T09:52:14.049Z","building":"2025-07-06T09:52:17.303Z","testing":"2025-07-10T13:39:09.960Z","firing":"2025-07-10T13:39:10.580Z","smoothing":"2025-07-10T13:39:11.163Z","tuning1":"2025-07-10T13:39:12.457Z"}	t	Order fulfilled in Shopify	2025-05-24 14:29:45.079138	2025-07-25 07:50:31.235	\N
4373	386	1632-1	Innato Am3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"type":"Innato Am3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Am3","color":"Blue, with Terra and Gold Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-07-24T13:20:57.760Z","validated":"2025-07-24T13:23:23.957Z"}	f	\N	2025-06-26 05:58:50.434424	2025-07-25 07:54:12.407	\N
4328	358	1604-15	Natey Fm4	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-06 12:21:05.667	\N	\N	16691002016075	{"type":"Natey Fm4","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"Fm4","color":"Blue, with Terra and Gold Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-07-06T11:35:04.626Z","validated":"2025-07-06T11:35:05.743Z","building":"2025-07-06T12:21:05.667Z","testing":"2025-07-10T13:39:30.860Z","firing":"2025-07-10T13:39:32.517Z","smoothing":"2025-07-10T13:39:33.978Z","tuning1":"2025-07-10T13:44:57.807Z","waxing":"2025-07-15T09:23:05.997Z","tuning2":"2025-07-15T09:23:08.205Z","bagging":"2025-07-15T11:25:11.567Z"}	t	Order fulfilled in Shopify	2025-05-21 07:08:04.416596	2025-07-25 07:50:32.084	\N
4332	359	1605-1	Innato Dm4	\N	\N	\N	1.7	\N	\N	\N	\N	2025-07-06 11:25:32.107	\N	\N	16694270427467	{"type":"Innato Dm4","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Dm4","color":"Smokefired Terra and Black","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-07-06T11:25:26.409Z","dry":"2025-07-06T11:25:29.680Z","building":"2025-07-06T11:25:32.107Z","validated":"2025-07-06T11:25:33.396Z","testing":"2025-07-12T08:09:09.385Z","firing":"2025-07-12T08:09:10.647Z","tuning1":"2025-07-12T08:20:44.956Z","waxing":"2025-07-12T08:20:46.175Z","bagging":"2025-07-15T08:15:44.967Z","boxing":"2025-07-15T08:15:45.791Z","tuning2":"2025-07-15T11:16:55.338Z","labeling":"2025-07-15T11:30:03.637Z"}	t	Order fulfilled in Shopify	2025-05-21 13:28:27.448898	2025-07-25 07:50:31.609	\N
4319	358	1604-6	Innato Cm4	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-06 11:20:13.5	\N	\N	16691001721163	{"type":"Innato Cm4","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Cm4","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-07-06T11:20:10.921Z","dry":"2025-07-06T11:20:12.152Z","building":"2025-07-06T11:20:13.500Z","validated":"2025-07-06T11:20:14.805Z","testing":"2025-07-12T08:08:34.346Z","firing":"2025-07-12T08:08:35.673Z","tuning1":"2025-07-12T08:22:02.634Z","waxing":"2025-07-12T08:22:04.664Z","bagging":"2025-07-15T11:28:45.468Z"}	t	Order fulfilled in Shopify	2025-05-21 07:08:03.574863	2025-07-25 07:50:32.756	\N
5	6	1597-1	Innato Fm3	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-17 06:45:42.566	\N	\N	16652674072907	{"type":"Innato Fm3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Fm3","color":"Smokefired Terra with Terra and bronze Bubbles","key":"432 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-07-06T10:28:34.300Z","validated":"2025-07-17T06:45:41.555Z","building":"2025-07-17T06:45:42.566Z"}	f	\N	2025-05-13 14:49:20.684444	2025-07-25 07:50:34.261	\N
6	7	1596-1	Natey Cm4	\N	\N	\N	\N	\N	\N	\N	\N	2025-06-24 10:49:37.876	\N	\N	16646644695371	{"type":"Natey Cm4","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"Cm4","color":"Blue, with Terra and Gold Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-06-18T12:55:50.792Z","validated":"2025-06-24T10:49:36.621Z","building":"2025-06-24T10:49:37.876Z"}	t	Order fulfilled in Shopify	2025-05-13 14:49:20.867109	2025-07-25 07:50:34.45	\N
15	9	1594-8	Innato Cm4	\N	\N	\N	\N	\N	\N	\N	\N	2025-06-05 07:18:24.867	\N	\N	16637598630219	{"customBoxSize":"50x50x50","useJointBox":true,"type":"Innato Cm4","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Cm4","color":"Blue, with Terra and Gold Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-06-05T07:18:20.100Z","validated":"2025-06-05T07:18:21.197Z","dry":"2025-06-05T07:18:22.499Z","building":"2025-06-05T07:18:24.867Z","testing":"2025-06-05T07:18:25.779Z","firing":"2025-06-05T07:18:27.011Z","smoothing":"2025-06-05T07:18:27.924Z","tuning1":"2025-06-05T07:18:28.908Z","waxing":"2025-06-05T07:18:30.288Z","tuning2":"2025-06-07T09:40:49.205Z","bagging":"2025-06-08T07:59:32.589Z","boxing":"2025-06-08T07:59:37.940Z","labeling":"2025-06-08T08:43:26.781Z"}	t	Order fulfilled in Shopify	2025-05-13 14:49:21.504851	2025-07-25 07:50:35.294	\N
4387	384	1630-10	Innato Dm4	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-22 10:04:12.035	\N	\N	16919344120139	{"type":"Innato Dm4","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Dm4","color":"Blue, with Terra and Gold Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{}	f	\N	2025-07-14 09:06:22.356201	2025-07-25 07:50:23.092	\N
4285	335	1575-1	Natey Dm4	\N	\N	\N	.5	\N	\N	\N	\N	2025-05-13 18:08:18.274	\N	\N	16535593353547	{"type":"Natey Dm4","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"Dm4","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-05-13T18:08:16.859Z","dry":"2025-05-13T18:08:17.709Z","building":"2025-05-13T18:08:18.274Z","validated":"2025-05-13T18:08:18.908Z","testing":"2025-05-14T12:42:05.294Z","firing":"2025-05-14T12:42:08.345Z","tuning1":"2025-05-17T11:30:05.438Z","waxing":"2025-05-17T11:30:06.276Z","tuning2":"2025-05-17T11:30:07.157Z","bagging":"2025-05-17T12:30:37.809Z","boxing":"2025-05-17T12:30:39.050Z","labeling":"2025-05-17T13:27:37.440Z"}	t	Order fulfilled in Shopify	2025-05-13 14:57:01.091733	2025-07-25 07:50:40.066	\N
4326	358	1604-13	Natey Em3	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-10 13:29:30.537	\N	\N	16691001950539	{"type":"Natey Em3","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"Em3","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-07-08T11:04:23.925Z","validated":"2025-07-08T11:04:27.141Z","building":"2025-07-10T13:29:30.537Z","bagging":"2025-07-15T11:27:59.352Z","testing":"2025-07-15T12:06:26.673Z","firing":"2025-07-15T12:06:27.459Z","tuning1":"2025-07-15T12:06:28.426Z","waxing":"2025-07-15T12:06:29.372Z","tuning2":"2025-07-15T12:06:30.210Z"}	t	Order fulfilled in Shopify	2025-05-21 07:08:04.237034	2025-07-25 07:50:31.99	\N
4315	358	1604-2	Innato Am3	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-07 11:58:04.62	\N	\N	16691001590091	{"type":"Innato Am3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Am3","color":"Smokefired black with Terra and Copper Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-07-06T10:11:17.606Z","validated":"2025-07-06T10:11:18.814Z","building":"2025-07-07T11:58:04.619Z","testing":"2025-07-15T06:17:03.540Z","firing":"2025-07-15T06:17:04.857Z","tuning1":"2025-07-15T06:31:49.486Z","waxing":"2025-07-15T06:31:50.390Z","bagging":"2025-07-15T11:23:48.125Z"}	t	Order fulfilled in Shopify	2025-05-21 07:08:03.210394	2025-07-25 07:50:32.381	\N
4353	374	1620-1	Innato Bbm3	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-20 10:19:05.644	\N	\N	16789943058763	{"type":"Innato Bbm3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Bbm3","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-07-15T13:36:30.035Z","validated":"2025-07-20T10:19:04.516Z","building":"2025-07-20T10:19:05.644Z"}	f	\N	2025-06-13 18:38:15.506165	2025-07-25 07:50:27.036	\N
4394	400	1646-5	Natey Bm3	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-24 09:24:53.752	\N	\N	\N	{"type":"Natey Bm3","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"Bm3","color":"Smokefired black with Terra and Copper Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-07-17T08:33:59.475Z","validated":"2025-07-18T10:38:20.131Z","building":"2025-07-24T09:24:53.752Z"}	f	\N	2025-07-16 09:32:44.395441	2025-07-25 07:54:10.323	\N
4367	384	1630-5	Innato Cm4	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-21 14:45:51.92	\N	\N	16842507288907	{"type":"Innato Cm4","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Cm4","color":"Blue, with Terra and Gold Bubbles","key":"432 Hz","fulfillable_quantity":"1"}	ordered	0	{}	f	\N	2025-06-24 10:49:28.260792	2025-07-25 07:50:22.611	\N
4389	399	1645-1	Natey Am4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"type":"Natey Am4","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"Am4","color":"Smokefired Terra with Terra and bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{}	f	\N	2025-07-16 06:05:34.447923	2025-07-25 07:54:10.655	\N
4391	400	1646-2	Natey Am4	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-22 14:16:56.71	\N	\N	\N	{"type":"Natey Am4","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"Am4","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-07-16T11:03:58.657Z","validated":"2025-07-18T11:47:20.478Z","building":"2025-07-22T14:16:56.710Z"}	f	\N	2025-07-16 09:32:44.125649	2025-07-25 07:54:10.274	\N
4359	380	1626-1	Innato Dm4	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-17 12:25:42.429	\N	\N	16832163578187	{"type":"Innato Dm4","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Dm4","color":"Blue, with Terra and Gold Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{}	f	\N	2025-06-21 12:34:59.334388	2025-07-25 07:50:24.999	\N
4386	398	1644-1	ZEN flute Medium	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"type":"ZEN flute Medium","model":"ZEN","fluteType":"ZEN","tuningFrequency":"440Hz","frequency":"440","tuning":"M","color":"Smokefired Terra and Black","fulfillable_quantity":"1"}	ordered	0	{}	f	\N	2025-07-13 16:29:32.340267	2025-07-25 07:54:10.797	\N
4300	348	1560-3	Innato Em3 (NEW)	\N	\N	\N	\N	\N	\N	\N	\N	2025-05-21 12:18:37.319	\N	\N	16479418057035	{"type":"Innato Em3 (NEW)","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Em3","color":"Blue, with Terra and Gold Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-05-15T10:00:02.070Z","validated":"2025-05-15T10:10:53.630Z","building":"2025-05-21T12:18:37.318Z","testing":"2025-06-05T07:22:01.875Z","firing":"2025-06-06T13:11:32.464Z","smoothing":"2025-06-06T13:11:33.709Z","tuning1":"2025-06-06T13:11:35.041Z","tuning2":"2025-06-07T09:40:32.659Z","waxing":"2025-07-06T11:31:39.752Z","bagging":"2025-07-09T11:04:11.937Z","boxing":"2025-07-09T11:04:14.265Z","labeling":"2025-07-09T14:35:20.084Z"}	t	Order fulfilled in Shopify	2025-05-13 14:57:03.299301	2025-07-25 07:50:43.391	\N
4364	384	1630-2	Innato Am3	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-22 08:23:58.51	\N	\N	16842507190603	{"type":"Innato Am3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Am3","color":"Smokefired black with Terra and Copper Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{}	f	\N	2025-06-24 10:49:27.979074	2025-07-25 07:50:22.328	\N
4365	384	1630-3	Innato Bbm3	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-17 14:10:50.424	\N	\N	16842507223371	{"type":"Innato Bbm3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Bbm3","color":"Blue, with Terra and Gold Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{}	f	\N	2025-06-24 10:49:28.074843	2025-07-25 07:50:22.424	\N
4301	348	1560-4	Innato G#m3	\N	\N	\N	\N	\N	\N	\N	\N	2025-06-10 18:53:02.967	\N	\N	16479418089803	{"type":"Innato G#m3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"G#m3","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"0"}	ordered	0	{"ordered":"2025-06-05T08:27:52.196Z","validated":"2025-06-07T11:20:14.872Z","building":"2025-06-10T18:53:02.967Z","testing":"2025-07-06T11:04:31.002Z","firing":"2025-07-06T11:04:32.900Z","tuning1":"2025-07-07T07:59:33.941Z","waxing":"2025-07-07T07:59:35.397Z","bagging":"2025-07-09T11:04:45.717Z","boxing":"2025-07-09T11:04:46.134Z","labeling":"2025-07-09T14:35:20.667Z"}	t	Order fulfilled in Shopify	2025-05-13 14:57:03.335562	2025-07-25 07:50:43.438	Opnieuw
4392	400	1646-3	Natey Am4	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-23 09:17:27.003	\N	\N	\N	{"type":"Natey Am4","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"Am4","color":"Smokefired Terra with Terra and bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-07-16T11:40:23.957Z","validated":"2025-07-18T11:28:48.600Z","building":"2025-07-23T09:17:27.003Z"}	f	\N	2025-07-16 09:32:44.216257	2025-07-25 07:54:10.291	\N
4393	400	1646-4	Natey Bm3	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-24 06:43:36.498	\N	\N	\N	{"type":"Natey Bm3","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"Bm3","color":"Blue, with Terra and Gold Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-07-16T13:06:17.750Z","validated":"2025-07-18T08:14:52.573Z","building":"2025-07-24T06:43:36.497Z"}	f	\N	2025-07-16 09:32:44.306508	2025-07-25 07:54:10.307	\N
4366	384	1630-4	Innato Bbm3	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-22 08:23:29.239	\N	\N	16842507256139	{"type":"Innato Bbm3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Bbm3","color":"Smokefired Terra and Black","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{}	f	\N	2025-06-24 10:49:28.167635	2025-07-25 07:50:22.518	\N
4352	373	1621-1	Innato Dm4	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-20 11:20:34.202	\N	\N	16794782007627	{"type":"Innato Dm4","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Dm4","color":"Blue, with Terra and Gold Bubbles","key":"432 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-07-17T11:18:22.865Z","validated":"2025-07-18T07:26:35.208Z","building":"2025-07-20T11:20:34.202Z"}	f	\N	2025-06-13 18:38:15.3187	2025-07-25 07:50:26.605	\N
4408	403	1649-1	Innato Cm4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"type":"Innato Cm4","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Cm4","color":"Blue, with Terra and Gold Bubbles","key":"432 Hz","fulfillable_quantity":"1"}	ordered	0	{}	f	\N	2025-07-25 06:43:42.71117	2025-07-25 07:54:09.867	\N
4340	363	1608-2	ZEN flute Large	\N	\N	\N	0.9	\N	\N	\N	\N	2025-07-06 11:27:31.792	\N	\N	16707676111179	{"type":"ZEN flute Large","model":"ZEN","fluteType":"ZEN","tuningFrequency":"440Hz","frequency":"440","tuning":"L","color":"Blue, with Terra and Gold Bubbles","fulfillable_quantity":"1","boxSize":"20x20x20","Box Size":"20x20x20","box size":"20x20x20"}	ordered	0	{"ordered":"2025-07-06T11:27:29.366Z","dry":"2025-07-06T11:27:30.779Z","building":"2025-07-06T11:27:31.792Z","validated":"2025-07-06T11:27:32.986Z","testing":"2025-07-15T06:52:24.781Z","smoothing":"2025-07-15T06:52:26.173Z","firing":"2025-07-15T06:52:28.704Z","tuning1":"2025-07-15T06:52:29.976Z","tuning2":"2025-07-15T06:52:32.653Z","waxing":"2025-07-15T06:52:34.016Z","bagging":"2025-07-15T09:10:11.575Z","boxing":"2025-07-15T09:10:12.184Z","labeling":"2025-07-15T11:31:17.587Z"}	t	Order fulfilled in Shopify	2025-05-25 10:30:42.061895	2025-07-25 07:50:31.047	\N
4354	375	1619-1	Innato Am3	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-22 12:52:36.885	\N	\N	16788418462027	{"type":"Innato Am3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Am3","color":"Blue, with Terra and Gold Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-07-17T07:18:21.364Z","validated":"2025-07-17T07:18:22.626Z","building":"2025-07-22T12:52:36.885Z"}	f	\N	2025-06-13 18:38:15.64458	2025-07-25 07:50:27.464	\N
12	9	1594-5	Innato Bm3	\N	\N	\N	\N	\N	\N	\N	\N	2025-06-05 07:18:41.508	\N	\N	16637598531915	{"customBoxSize":"50x50x50","useJointBox":true,"type":"Innato Bm3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Bm3","color":"Blue, with Terra and Gold Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-06-05T07:18:36.562Z","validated":"2025-06-05T07:18:37.483Z","dry":"2025-06-05T07:18:40.150Z","building":"2025-06-05T07:18:41.508Z","testing":"2025-06-05T07:18:42.982Z","firing":"2025-06-05T07:18:43.907Z","smoothing":"2025-06-05T07:18:45.118Z","waxing":"2025-06-05T07:18:50.115Z","tuning1":"2025-06-05T07:18:51.940Z","tuning2":"2025-06-07T09:40:47.201Z","boxing":"2025-06-08T07:59:23.860Z","bagging":"2025-06-08T07:59:31.355Z","labeling":"2025-06-08T08:43:25.497Z"}	t	Order fulfilled in Shopify	2025-05-13 14:49:21.378593	2025-07-25 07:50:35.153	\N
4390	400	1646-1	Natey Am4	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-22 14:24:11.758	\N	\N	\N	{"type":"Natey Am4","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"Am4","color":"Blue, with Terra and Gold Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-07-16T11:02:35.187Z","validated":"2025-07-18T11:53:16.167Z","building":"2025-07-22T14:24:11.758Z"}	f	\N	2025-07-16 09:32:44.031496	2025-07-25 07:54:10.258	\N
21	11	1592-1	Innato Bm3	\N	\N	\N	2	\N	\N	\N	\N	2025-06-18 09:05:17.866	\N	\N	16626680430923	{"type":"Innato Bm3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Bm3","color":"Smokefired black with Terra and Copper Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-06-09T11:50:43.267Z","validated":"2025-06-12T10:38:44.309Z","building":"2025-06-18T09:05:17.866Z","waxing":"2025-06-30T10:37:16.102Z","firing":"2025-06-30T10:37:18.122Z","testing":"2025-06-30T10:37:20.675Z","tuning1":"2025-06-30T10:37:21.685Z","tuning2":"2025-07-04T07:28:58.193Z","bagging":"2025-07-04T08:08:04.726Z","boxing":"2025-07-04T10:28:44.802Z","labeling":"2025-07-04T11:10:19.432Z"}	t	Order fulfilled in Shopify	2025-05-13 14:49:22.017782	2025-07-25 07:50:35.719	\N
4288	338	1572-1	Natey Cm4	\N	\N	\N	.6	\N	\N	\N	\N	2025-05-24 10:20:38.196	\N	\N	16496935403851	{"type":"Natey Cm4","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"Cm4","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{"validated":"2025-05-22T11:53:15.787Z","ordered":"2025-05-22T11:53:16.643Z","building":"2025-05-24T10:20:38.195Z","testing":"2025-06-05T07:22:45.859Z","firing":"2025-06-06T14:04:53.663Z","tuning1":"2025-06-06T14:04:54.760Z","waxing":"2025-06-06T14:04:55.636Z","tuning2":"2025-06-06T14:04:56.611Z","bagging":"2025-06-07T19:52:10.961Z","boxing":"2025-06-07T19:52:11.485Z","labeling":"2025-06-08T08:27:40.276Z"}	t	Order fulfilled in Shopify	2025-05-13 14:57:01.538812	2025-07-25 07:50:40.877	\N
4293	343	1566-1	Natey Am3	\N	\N	\N	.6	\N	\N	\N	\N	2025-05-13 18:07:41.394	\N	\N	16486560072011	{"type":"Natey Am3","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"Am3","color":"Smokefired Terra with Terra and bronze Bubbles","key":"432 Hz","fulfillable_quantity":"1","bagType":"Natey","bagSize":"L","Bag Type":"Natey","Bag Size":"L","bag type":"Natey","bag size":"L"}	ordered	0	{"ordered":"2025-05-13T15:24:38.952Z","validated":"2025-05-13T18:07:39.791Z","dry":"2025-05-13T18:07:40.775Z","building":"2025-05-13T18:07:41.394Z","testing":"2025-05-14T12:41:55.769Z","firing":"2025-05-14T12:41:56.862Z","waxing":"2025-05-17T11:30:34.362Z","tuning1":"2025-05-17T11:30:35.244Z","tuning2":"2025-05-17T11:30:36.095Z","bagging":"2025-05-17T12:30:23.958Z","boxing":"2025-05-17T12:30:24.543Z","labeling":"2025-05-17T12:53:29.004Z"}	t	Order fulfilled in Shopify	2025-05-13 14:57:02.469496	2025-07-25 07:50:42.025	\N
4294	344	1565-1	Natey G#m4	\N	\N	\N	.5	\N	\N	\N	\N	2025-05-13 18:07:37.883	\N	\N	16484188782923	{"type":"Natey G#m4","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"G#m4","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1","bagType":"Natey","bagSize":"S","Bag Type":"Natey","Bag Size":"S","bag type":"Natey","bag size":"S"}	ordered	0	{"ordered":"2025-05-13T15:24:38.952Z","validated":"2025-05-13T18:07:36.281Z","dry":"2025-05-13T18:07:37.092Z","building":"2025-05-13T18:07:37.883Z","testing":"2025-05-14T12:41:53.823Z","firing":"2025-05-14T12:41:54.805Z","tuning1":"2025-05-16T12:39:06.597Z","waxing":"2025-05-17T11:31:29.442Z","tuning2":"2025-05-17T11:31:30.230Z","bagging":"2025-05-17T12:29:56.883Z","boxing":"2025-05-17T12:29:57.607Z","labeling":"2025-05-17T12:41:01.092Z"}	t	Order fulfilled in Shopify	2025-05-13 14:57:02.614892	2025-07-25 07:50:42.236	\N
4358	379	1625-1	Natey Em4	\N	\N	\N	0.3	\N	\N	\N	\N	2025-07-07 14:07:59.599	\N	\N	\N	{"type":"Natey Em4","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"Em4","color":"Smokefired Blue with Red and Bronze Bubbles","key":"432 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-07-07T14:07:56.938Z","validated":"2025-07-07T14:07:57.585Z","dry":"2025-07-07T14:07:59.024Z","building":"2025-07-07T14:07:59.599Z","testing":"2025-07-07T14:08:01.551Z","firing":"2025-07-07T14:08:02.124Z","tuning1":"2025-07-07T14:08:03.607Z","boxing":"2025-07-09T11:28:53.687Z","bagging":"2025-07-09T11:28:54.183Z","labeling":"2025-07-09T14:46:27.732Z"}	t	Order fulfilled in Shopify	2025-06-21 05:40:04.278242	2025-07-25 07:50:25.187	\N
27	17	1585-1	Innato Dm4	\N	\N	\N	1.8	\N	\N	\N	\N	2025-06-10 15:18:56.151	\N	\N	16574528029003	{"type":"Innato Dm4","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Dm4","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-06-09T09:25:02.368Z","validated":"2025-06-10T15:18:54.638Z","building":"2025-06-10T15:18:56.151Z","testing":"2025-06-30T10:33:08.807Z","firing":"2025-06-30T10:33:09.825Z","tuning1":"2025-06-30T10:33:10.923Z","waxing":"2025-06-30T10:33:11.911Z","tuning2":"2025-07-04T07:37:01.213Z","bagging":"2025-07-04T08:12:47.151Z","boxing":"2025-07-04T10:28:40.420Z","labeling":"2025-07-04T10:54:05.328Z"}	t	Order fulfilled in Shopify	2025-05-13 14:49:23.096317	2025-07-25 07:50:38.258	\N
4279	330	1580-1	Innato Cm4	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-08 09:17:13.15	\N	\N	16563508445515	{"type":"Innato Cm4","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Cm4","color":"Blue, with Terra and Gold Bubbles","key":"432 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-07-08T09:14:24.950Z","validated":"2025-07-08T09:14:25.588Z","testing":"2025-07-08T09:17:12.115Z","dry":"2025-07-08T09:17:12.664Z","building":"2025-07-08T09:17:13.150Z","firing":"2025-07-08T09:17:14.474Z","smoothing":"2025-07-08T09:17:15.083Z","tuning1":"2025-07-08T09:17:15.882Z","waxing":"2025-07-08T09:17:16.839Z","tuning2":"2025-07-14T08:04:47.877Z","bagging":"2025-07-15T11:51:41.202Z"}	t	Order fulfilled in Shopify	2025-05-13 14:57:00.308167	2025-07-25 07:50:39.06	\N
4276	327	1584-1	ZEN flute Medium	\N	\N	\N	.4	\N	\N	\N	\N	2025-06-17 12:39:54.954	\N	\N	16569193529675	{"type":"ZEN flute Medium","model":"ZEN","fluteType":"ZEN","tuningFrequency":"440Hz","frequency":"440","tuning":"M","color":"Smokefired Terra and Black","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-06-05T11:30:50.642Z","building":"2025-06-17T12:39:54.954Z","validated":"2025-06-17T12:39:56.338Z","testing":"2025-06-30T10:28:16.891Z","firing":"2025-06-30T10:28:18.626Z","tuning1":"2025-06-30T10:28:20.578Z","waxing":"2025-06-30T10:28:21.779Z","tuning2":"2025-06-30T10:28:24.428Z","bagging":"2025-07-04T08:07:53.470Z","boxing":"2025-07-04T10:27:26.911Z","labeling":"2025-07-04T10:50:33.143Z"}	t	Order fulfilled in Shopify	2025-05-13 14:56:59.844013	2025-07-25 07:50:38.445	\N
14	9	1594-7	Innato Bm3	\N	\N	\N	\N	\N	\N	\N	\N	2025-06-06 13:46:15.248	\N	\N	16637598597451	{"customBoxSize":"50x50x50","useJointBox":true,"type":"Innato Bm3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Bm3","color":"Smokefired black with Terra and Copper Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-06-06T13:46:11.753Z","validated":"2025-06-06T13:46:12.895Z","dry":"2025-06-06T13:46:14.255Z","building":"2025-06-06T13:46:15.248Z","testing":"2025-06-06T13:46:16.250Z","firing":"2025-06-06T13:46:17.351Z","tuning1":"2025-06-06T14:09:28.855Z","waxing":"2025-06-06T14:09:29.931Z","tuning2":"2025-06-07T09:40:48.112Z","boxing":"2025-06-08T07:59:25.123Z","bagging":"2025-06-08T07:59:31.988Z","labeling":"2025-06-08T08:43:26.114Z"}	t	Order fulfilled in Shopify	2025-05-13 14:49:21.464577	2025-07-25 07:50:35.247	\N
4371	384	1630-9	Innato Bm3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16842507419979	{"type":"Innato Bm3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Bm3","color":"Smokefired Blue with Red and Bronze Bubbles","key":"432 Hz","fulfillable_quantity":"1"}	ordered	0	{}	f	\N	2025-06-24 10:49:28.639168	2025-07-25 07:50:22.994	\N
4368	384	1630-6	Innato Cm4	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-22 07:22:32.64	\N	\N	16842507321675	{"type":"Innato Cm4","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Cm4","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{}	f	\N	2025-06-24 10:49:28.354331	2025-07-25 07:50:22.705	\N
26	16	1586-1	ZEN flute Medium	\N	\N	\N	.5	\N	\N	\N	\N	2025-06-07 12:15:31.203	\N	\N	16587053236555	{"type":"ZEN flute Medium","model":"ZEN","fluteType":"ZEN","tuningFrequency":"440Hz","frequency":"440","tuning":"M","color":"Smokefired Terra and Black","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-06-05T12:39:00.061Z","validated":"2025-06-07T12:15:30.056Z","building":"2025-06-07T12:15:31.203Z","testing":"2025-06-30T10:29:41.584Z","firing":"2025-06-30T10:29:42.960Z","tuning1":"2025-06-30T10:29:43.962Z","waxing":"2025-06-30T10:29:44.958Z","tuning2":"2025-06-30T10:29:46.067Z","bagging":"2025-07-04T08:07:54.515Z","boxing":"2025-07-04T10:28:41.821Z","labeling":"2025-07-04T10:52:37.770Z"}	t	Order fulfilled in Shopify	2025-05-13 14:49:22.933765	2025-07-25 07:50:36.775	\N
4361	382	1629-1	Innato Am3	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-21 13:50:33.355	\N	\N	16841887646027	{"type":"Innato Am3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Am3","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{}	f	\N	2025-06-24 08:26:39.622571	2025-07-25 07:50:23.584	\N
4369	384	1630-7	Innato Cm4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16842507354443	{"type":"Innato Cm4","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Cm4","color":"Smokefired black with Terra and Copper Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{}	f	\N	2025-06-24 10:49:28.4512	2025-07-25 07:50:22.799	\N
4	5	1598-1	Innato Gm3	\N	\N	\N	 2.6	\N	\N	\N	\N	2025-06-23 11:59:02.995	\N	\N	16655963980107	{"type":"Innato Gm3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Gm3","color":"Blue, with Terra and Gold Bubbles","key":"432 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-06-18T13:15:16.879Z","validated":"2025-06-19T08:25:08.425Z","building":"2025-06-23T11:59:02.994Z","testing":"2025-07-12T13:37:55.960Z","firing":"2025-07-12T13:37:56.943Z","smoothing":"2025-07-12T13:37:58.000Z","tuning1":"2025-07-12T13:37:58.941Z","waxing":"2025-07-12T13:37:59.959Z","tuning2":"2025-07-12T13:38:01.039Z","boxing":"2025-07-15T09:23:56.585Z","bagging":"2025-07-15T09:23:57.936Z","labeling":"2025-07-15T11:24:17.771Z"}	t	Order fulfilled in Shopify	2025-05-13 14:49:20.51061	2025-07-25 07:50:33.827	\N
4303	349	1559-2	Innato Am3	\N	\N	\N	\N	\N	\N	\N	\N	2025-05-20 12:55:02.351	\N	\N	16479365497163	{"type":"Innato Am3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Am3","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1","boxSize":{"type":"standard","size":"35x35x35"},"Box Size":{"type":"standard","size":"35x35x35"},"box size":{"type":"standard","size":"35x35x35"}}	ordered	0	{"ordered":"2025-05-19T09:14:57.687Z","validated":"2025-05-19T09:15:02.945Z","building":"2025-05-20T12:55:02.351Z","testing":"2025-06-05T07:24:13.729Z","firing":"2025-06-06T13:26:55.522Z","tuning1":"2025-06-06T13:26:56.590Z","waxing":"2025-06-06T13:26:57.608Z","tuning2":"2025-06-07T09:40:27.170Z","boxing":"2025-07-09T11:05:43.207Z","bagging":"2025-07-09T11:05:43.850Z","labeling":"2025-07-09T14:35:19.500Z"}	t	Order fulfilled in Shopify	2025-05-13 14:57:03.517385	2025-07-25 07:50:43.682	Ggg
17	9	1594-10	Innato Cm4	\N	\N	\N	\N	\N	\N	\N	\N	2025-06-06 14:00:38.801	\N	\N	16637598695755	{"customBoxSize":"50x50x50","useJointBox":true,"type":"Innato Cm4","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Cm4","color":"Smokefired Terra and Black","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{"validated":"2025-06-06T14:00:33.485Z","ordered":"2025-06-06T14:00:34.974Z","dry":"2025-06-06T14:00:37.912Z","building":"2025-06-06T14:00:38.801Z","testing":"2025-06-06T14:00:41.430Z","firing":"2025-06-06T14:00:42.344Z","tuning1":"2025-06-06T14:00:43.349Z","waxing":"2025-06-06T14:00:44.516Z","tuning2":"2025-06-07T09:40:51.430Z","bagging":"2025-06-08T07:59:33.194Z","boxing":"2025-06-08T07:59:37.274Z","labeling":"2025-06-08T08:43:27.414Z"}	t	Order fulfilled in Shopify	2025-05-13 14:49:21.593013	2025-07-25 07:50:34.87	\N
19	9	1594-12	Innato Em4	\N	\N	\N	13.5	\N	\N	\N	\N	2025-06-05 07:23:25.429	\N	\N	16637598761291	{"customBoxSize":"50x50x50","useJointBox":true,"type":"Innato Em4","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Em4","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-06-05T07:23:22.827Z","dry":"2025-06-05T07:23:24.355Z","building":"2025-06-05T07:23:25.429Z","validated":"2025-06-05T07:23:26.562Z","testing":"2025-06-05T07:23:27.710Z","firing":"2025-06-05T13:20:57.068Z","tuning1":"2025-06-05T13:20:59.550Z","waxing":"2025-06-05T13:21:00.612Z","tuning2":"2025-06-07T09:40:53.212Z","bagging":"2025-06-08T07:59:34.406Z","boxing":"2025-06-08T07:59:35.073Z","labeling":"2025-06-08T08:43:31.814Z"}	t	Order fulfilled in Shopify	2025-05-13 14:49:21.672466	2025-07-25 07:50:34.964	\N
4278	329	1582-1	Natey Gm3	\N	\N	\N	0.6	\N	\N	\N	\N	2025-06-18 11:38:42.386	\N	\N	16565900673355	{"type":"Natey Gm3","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"Gm3","color":"Blue, with Terra and Gold Bubbles","key":"440 Hz","fulfillable_quantity":"1","bagType":"Natey","bagSize":"L","Bag Type":"Natey","Bag Size":"L","bag type":"Natey","bag size":"L"}	ordered	0	{"ordered":"2025-06-18T10:13:00.146Z","validated":"2025-06-18T11:38:41.439Z","building":"2025-06-18T11:38:42.386Z","testing":"2025-07-15T10:08:46.251Z","firing":"2025-07-15T10:08:46.947Z","smoothing":"2025-07-15T10:08:47.493Z","tuning1":"2025-07-15T10:08:48.031Z","waxing":"2025-07-15T10:08:48.572Z","tuning2":"2025-07-15T10:08:53.529Z","bagging":"2025-07-15T10:30:54.595Z","boxing":"2025-07-15T10:30:55.037Z","labeling":"2025-07-15T11:20:58.022Z"}	t	Order fulfilled in Shopify	2025-05-13 14:57:00.14217	2025-07-25 07:50:38.826	\N
4295	345	1564-1	Innato Em4	\N	\N	\N	1.8	\N	\N	\N	\N	2025-05-13 18:07:35.493	\N	\N	16483698901323	{"type":"Innato Em4","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Em4","color":"Blue, with Terra and Gold Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-05-13T15:24:38.952Z","validated":"2025-05-13T18:07:33.725Z","dry":"2025-05-13T18:07:34.641Z","building":"2025-05-13T18:07:35.493Z","testing":"2025-05-14T12:41:52.210Z","firing":"2025-05-14T12:41:52.969Z","smoothing":"2025-05-16T12:59:06.783Z","tuning1":"2025-05-16T12:59:07.571Z","tuning2":"2025-05-16T12:59:09.169Z","waxing":"2025-05-16T12:59:09.914Z","bagging":"2025-05-17T12:31:09.621Z","boxing":"2025-05-17T12:31:11.282Z","labeling":"2025-05-17T12:40:08.293Z"}	t	Order fulfilled in Shopify	2025-05-13 14:57:02.762393	2025-07-25 07:50:42.429	\N
4388	358	1604-23	Double Large Native Gm3	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-15 12:12:18.481	\N	\N	16920727454027	{"type":"Double Large Native Gm3","model":"DOUBLE","fluteType":"DOUBLE","tuningFrequency":"440Hz","frequency":"440","tuning":"Gm3","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{"bagging":"2025-07-15T11:26:42.601Z","ordered":"2025-07-15T12:12:13.724Z","tuning2":"2025-07-15T12:12:14.758Z","waxing":"2025-07-15T12:12:15.472Z","tuning1":"2025-07-15T12:12:16.093Z","firing":"2025-07-15T12:12:16.791Z","testing":"2025-07-15T12:12:17.373Z","dry":"2025-07-15T12:12:17.925Z","building":"2025-07-15T12:12:18.481Z","validated":"2025-07-15T12:12:19.040Z"}	t	Order fulfilled in Shopify	2025-07-15 05:22:22.501594	2025-07-25 07:50:32.569	\N
8	9	1594-1	Innato Am3	\N	\N	\N	\N	\N	\N	\N	\N	2025-06-05 07:23:57.846	\N	\N	16637598400843	{"customBoxSize":"50x50x50","useJointBox":true,"type":"Innato Am3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Am3","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-06-05T07:23:52.837Z","validated":"2025-06-05T07:23:55.616Z","dry":"2025-06-05T07:23:56.728Z","building":"2025-06-05T07:23:57.846Z","testing":"2025-06-05T07:23:58.956Z","firing":"2025-06-05T14:09:29.993Z","tuning1":"2025-06-05T14:09:30.873Z","waxing":"2025-06-05T14:09:31.433Z","tuning2":"2025-06-07T09:40:44.071Z","boxing":"2025-06-08T07:59:20.206Z","bagging":"2025-06-08T07:59:29.056Z","labeling":"2025-06-08T08:43:23.415Z"}	t	Order fulfilled in Shopify	2025-05-13 14:49:21.212571	2025-07-25 07:50:34.823	\N
4383	395	1641-1	Natey Am3	\N	\N	\N	.6	\N	\N	\N	\N	2025-07-04 07:57:22.022	\N	\N	\N	{"type":"Natey Am3","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"Am3","color":"Smokefired black with Terra and Copper Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-07-04T07:57:14.496Z","validated":"2025-07-04T07:57:15.584Z","testing":"2025-07-04T07:57:19.120Z","dry":"2025-07-04T07:57:20.766Z","building":"2025-07-04T07:57:22.022Z","firing":"2025-07-04T07:57:23.662Z","tuning1":"2025-07-04T07:57:24.649Z","waxing":"2025-07-04T07:57:25.682Z","tuning2":"2025-07-04T07:57:26.895Z","bagging":"2025-07-04T08:12:26.358Z","boxing":"2025-07-04T10:28:37.470Z","labeling":"2025-07-04T10:38:30.070Z"}	t	Order fulfilled in Shopify	2025-07-03 17:54:39.49659	2025-07-25 07:54:11.147	\N
4316	358	1604-3	Innato Bm3	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-06 11:24:13.489	\N	\N	16691001622859	{"type":"Innato Bm3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Bm3","color":"Blue, with Terra and Gold Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-07-06T11:24:11.195Z","dry":"2025-07-06T11:24:12.231Z","building":"2025-07-06T11:24:13.489Z","validated":"2025-07-06T11:24:14.489Z","testing":"2025-07-15T07:53:19.970Z","firing":"2025-07-15T07:53:23.134Z","smoothing":"2025-07-15T07:53:24.682Z","waxing":"2025-07-15T07:53:28.414Z","tuning1":"2025-07-15T07:53:29.267Z","bagging":"2025-07-15T11:23:56.809Z"}	t	Order fulfilled in Shopify	2025-05-21 07:08:03.303244	2025-07-25 07:50:32.616	\N
22	12	1591-1	ZEN flute Large	\N	\N	\N	.7	\N	\N	\N	\N	2025-06-16 12:24:51.232	\N	\N	16604072411467	{"type":"ZEN flute Large","model":"ZEN","fluteType":"ZEN","tuningFrequency":"440Hz","frequency":"440","tuning":"L","color":"Blue, with Terra and Gold Bubbles","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-06-09T13:49:04.641Z","validated":"2025-06-16T12:24:42.897Z","building":"2025-06-16T12:24:51.232Z","smoothing":"2025-06-30T10:30:42.931Z","testing":"2025-06-30T10:30:43.984Z","firing":"2025-06-30T10:30:45.256Z","tuning1":"2025-06-30T10:30:46.249Z","waxing":"2025-06-30T10:30:47.480Z","tuning2":"2025-06-30T10:30:48.580Z","bagging":"2025-07-04T08:08:05.001Z","boxing":"2025-07-04T10:28:43.504Z","labeling":"2025-07-04T10:43:46.858Z"}	t	Order fulfilled in Shopify	2025-05-13 14:49:22.176344	2025-07-25 07:50:35.908	\N
4330	358	1604-17	Natey Gm3	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-07 13:25:51.127	\N	\N	16691002081611	{"type":"Natey Gm3","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"Gm3","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-07-06T11:34:24.864Z","validated":"2025-07-06T11:34:26.126Z","building":"2025-07-07T13:25:51.126Z","testing":"2025-07-15T06:42:53.088Z","firing":"2025-07-15T06:42:54.163Z","tuning1":"2025-07-15T06:42:55.409Z","waxing":"2025-07-15T06:42:56.524Z","tuning2":"2025-07-15T06:42:57.481Z","bagging":"2025-07-15T11:27:23.829Z"}	t	Order fulfilled in Shopify	2025-05-21 07:08:04.595363	2025-07-25 07:50:32.239	\N
4331	358	1604-18	Natey Gm3	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-08 07:34:54.289	\N	\N	16691002114379	{"type":"Natey Gm3","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"Gm3","color":"Smokefired black with Terra and Copper Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-07-06T11:33:54.525Z","validated":"2025-07-06T11:33:55.921Z","building":"2025-07-08T07:34:54.289Z","firing":"2025-07-15T06:57:22.804Z","testing":"2025-07-15T06:57:24.014Z","tuning1":"2025-07-15T06:57:25.104Z","waxing":"2025-07-15T06:57:26.413Z","tuning2":"2025-07-15T06:57:27.540Z","bagging":"2025-07-15T11:27:15.814Z"}	t	Order fulfilled in Shopify	2025-05-21 07:08:04.699988	2025-07-25 07:50:32.286	\N
4349	358	1604-22	Double Large Native Gm3	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-15 12:12:12.157	\N	\N	16694322659659	{"type":"Double Large Native Gm3","model":"DOUBLE","fluteType":"DOUBLE","tuningFrequency":"440Hz","frequency":"440","tuning":"Gm3","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-07-15T12:12:05.092Z","bagging":"2025-07-15T12:12:06.577Z","tuning2":"2025-07-15T12:12:07.657Z","waxing":"2025-07-15T12:12:08.841Z","tuning1":"2025-07-15T12:12:09.541Z","firing":"2025-07-15T12:12:10.310Z","testing":"2025-07-15T12:12:10.939Z","dry":"2025-07-15T12:12:11.522Z","building":"2025-07-15T12:12:12.157Z","validated":"2025-07-15T12:12:12.842Z"}	t	Order fulfilled in Shopify	2025-06-05 12:33:34.347911	2025-07-25 07:50:32.522	\N
4292	342	1567-1	Natey Am4	\N	\N	\N	.5	\N	\N	\N	\N	2025-05-13 18:07:50.644	\N	\N	16489221980491	{"type":"Natey Am4","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"Am4","color":"Blue, with Terra and Gold Bubbles","key":"432 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-05-13T15:24:38.952Z","validated":"2025-05-13T18:07:49.043Z","dry":"2025-05-13T18:07:49.924Z","building":"2025-05-13T18:07:50.644Z","testing":"2025-05-14T12:41:57.619Z","firing":"2025-05-14T12:41:58.400Z","smoothing":"2025-05-16T13:09:54.066Z","tuning1":"2025-05-16T13:09:54.841Z","waxing":"2025-05-16T13:09:59.795Z","tuning2":"2025-05-16T13:10:07.623Z","bagging":"2025-05-17T12:30:09.172Z","boxing":"2025-05-17T12:30:10.396Z","labeling":"2025-05-17T12:57:04.304Z"}	t	Order fulfilled in Shopify	2025-05-13 14:57:02.32261	2025-07-25 07:50:41.836	\N
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.orders (id, order_number, shopify_order_id, customer_name, customer_email, customer_phone, customer_address, customer_city, customer_state, customer_zip, customer_country, order_type, is_reseller, reseller_nickname, status, order_date, deadline, notes, progress, specifications, status_change_dates, build_date, archived, tracking_number, tracking_company, tracking_url, shipped_date, estimated_delivery_date, delivery_status, delivered_date, created_at, updated_at, is_urgent) FROM stdin;
16	SW-1586	6596973330763	Wen Colenbrander	coltha@gmail.com	0653130517	Prinses Marijkelaan 19, 3hoog	Zeist	\N	3708 DA	Netherlands	retail	f	\N	archived	2025-04-17 16:40:45	\N		0	{"type":"ZEN flute Medium","model":"ZEN","fluteType":"ZEN","tuningFrequency":"440Hz","frequency":"440","tuning":"M","color":"Smokefired Terra and Black","fulfillable_quantity":"1"}	{}	\N	t	\N	\N	\N	\N	\N	\N	\N	2025-05-13 14:49:22.878286	2025-07-25 07:50:36.682	f
7	SW-1596	6627566846283	Jean-Luc Kumpen	boekhouding@elaisawellness.com	+3289390996	Zetellaan 50, Elaisa Wellness - 50/2	Maasmechelen	\N	3630	Belgium	retail	f	\N	archived	2025-05-07 12:49:36	\N		0	{"type":"Natey Cm4","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"Cm4","color":"Blue, with Terra and Gold Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	{}	\N	t	\N	\N	\N	\N	\N	\N	\N	2025-05-13 14:49:20.824303	2025-07-25 07:50:34.357	f
6	SW-1597	6630623412555	Octavian Iacob	kontakt@sonusoasis.de	01751517187	Falderstraße 35	Köln	\N	50999	Germany	retail	f	\N	archived	2025-05-09 09:05:20	\N	Breuk binnen ophalen, bellen wanneer klaar 9 august	0	{"type":"Innato Fm3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Fm3","color":"Smokefired Terra with Terra and bronze Bubbles","key":"432 Hz","fulfillable_quantity":"1"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-05-13 14:49:20.636231	2025-07-21 13:27:15.018	f
1	SW-2025-001	shopify_1234567890	John Doe	john@example.com	+31612345678	123 Main Street	Amsterdam	Noord-Holland	1011AB	NL	retail	f	\N	archived	2025-05-01 00:00:00	2025-05-25 00:00:00	First test order with a single Innato A3 flute	30	{"package_gift": "true", "include_card": "false"}	{"ordered": "2025-05-01T00:00:00.000Z", "validated": "2025-05-02T10:30:00.000Z", "building": "2025-05-03T14:45:00.000Z"}	\N	t	\N	\N	\N	\N	\N	\N	\N	2025-05-01 00:00:00	2025-05-13 14:49:18.294	f
2	SW-1601	6638319632715	James Steinbrecher	jamesesteinbrecher818@yahoo.com	+19062826644	137 Mission Ridge Overlook	hayesville	North Carolina	28904	United States	retail	f	\N	archived	2025-05-13 13:12:02	\N		0	{"type":"Natey F#m4","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"F#m4","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	{}	\N	t	\N	\N	\N	\N	\N	\N	\N	2025-05-13 14:49:19.928458	2025-07-25 07:50:33.094	f
8	SW-1595	6625981661515	allemoz corinne	allemoz.corinne@gmail.com	+33788259468	14 avenue des libellules	Villeparisis	\N	77270	France	retail	f	\N	archived	2025-05-06 15:34:04	\N		0	{"type":"Natey G#m4","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"G#m4","color":"Smokefired Terra with Terra and bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	{}	\N	t	\N	\N	\N	\N	\N	\N	\N	2025-05-13 14:49:21.013571	2025-07-25 07:50:34.543	f
3	SW-1600	6637323682123	Michaela Vihs	M.vihs@yahoo.de	+491754978692	Bachstraße 3	Dorste	\N	37520	Germany	retail	f	\N	archived	2025-05-12 21:03:03	\N		0	{"type":"Natey Am4","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"Am4","color":"Blue, with Terra and Gold Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	{}	\N	t	\N	\N	\N	\N	\N	\N	\N	2025-05-13 14:49:20.12324	2025-07-25 07:50:33.296	f
360	SW-1606	6656407535947	Jeffrey Cordle	jeffrey.cordle@yahoo.com	+17063463190	4848 Big Texas Valley Road	Rome	Georgia	30165	United States	retail	f	\N	archived	2025-05-24 00:36:48	\N		0	{"type":"Innato Am3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Am3","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	{}	\N	t	\N	\N	\N	\N	\N	\N	\N	2025-05-24 04:03:01.49494	2025-07-25 07:50:31.327	f
358	SW-1604	6650007617867	Ivo Sedlacek	info@savita.cz	+420603481984	V Aleji 42	Jablonec nad Nisou	\N	466 01	Czech Republic	retail	t	IVO	archived	2025-05-20 16:57:20	\N		0	{"type":"Innato Am3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Am3","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	{}	\N	t	\N	\N	\N	\N	\N	\N	\N	2025-05-21 07:08:02.94018	2025-07-25 07:50:31.702	f
4	SW-1599	6635132780875	James Steinbrecher	jamesesteinbrecher818@yahoo.com	+19062826644	137 Mission Ridge Overlook	hayesville	North Carolina	28904	United States	retail	f	\N	archived	2025-05-11 22:59:30	\N		0	{"type":"Natey Am4","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"Am4","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	{}	\N	t	\N	\N	\N	\N	\N	\N	\N	2025-05-13 14:49:20.299986	2025-07-25 07:50:33.542	f
14	SW-1589	6598869025099	Jill Glozier	jillwerndly@hotmail.com	+447737403791	11 Moore Avenue	South Shields	England	NE34 6AA	United Kingdom	retail	f	\N	archived	2025-04-19 08:32:15	\N		0	{"type":"Natey Dm4","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"Dm4","color":"Blue, with Terra and Gold Bubbles","key":"432 Hz","fulfillable_quantity":"1"}	{}	\N	t	\N	\N	\N	\N	\N	\N	\N	2025-05-13 14:49:22.510791	2025-07-25 07:50:36.255	f
15	SW-1588	6598590628171	Oliver Dür	oliver.duer@gmail.com	6604830112	Hof 302	Reuthe	\N	6870	Austria	retail	f	\N	archived	2025-04-18 21:27:55	\N		0	{"type":"Natey G#m4","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"G#m4","color":"Smokefired Terra with Terra and bronze Bubbles","key":"432 Hz","fulfillable_quantity":"1"}	{}	\N	t	\N	\N	\N	\N	\N	\N	\N	2025-05-13 14:49:22.6839	2025-07-25 07:50:36.449	f
5	SW-1598	6632168784203	Samora Yeboah	zuddha@hotmail.com	07568963160	45 Gaskill Street	Rochdale	England	OL10 4RB	United Kingdom	retail	f	\N	archived	2025-05-10 09:09:49	\N		0	{"type":"Innato Gm3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Gm3","color":"Blue, with Terra and Gold Bubbles","key":"432 Hz","fulfillable_quantity":"1"}	{}	\N	t	\N	\N	\N	\N	\N	\N	\N	2025-05-13 14:49:20.471938	2025-07-25 07:50:33.733	f
390	SW-1635	6730124689739	Math Van Laar	math.vanlaar@gmail.com	+31646596674	Pommer 16	Nuth	\N	6361 VB	Netherlands	retail	f	\N	ordered	2025-06-28 10:13:39	\N		0	{"type":"Natey Gm3","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"Gm3","color":"Smokefired black with Terra and Copper Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-06-29 05:52:04.251871	2025-06-29 05:52:04.251871	f
391	SW-1637	6732819792203	Kerem Brule	kerembrule@gmail.com	+16195492924	797 NH Route 10	Orford	New Hampshire	03777	United States	reseller	t	KEREM	ordered	2025-06-29 20:09:45	\N		0	{"type":"Innato Am3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Am3","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-06-30 12:11:02.679955	2025-06-30 12:11:02.679955	f
361	SW-1607	6657331298635	Mitia Klein	mitiaklein24@gmail.com	+33603388169	, 27 rue des entrepots	saint quen sur seine	\N	93400	Netherlands	retail	t	MITIA	archived	2025-05-24 14:26:40	\N		0	{"type":"Natey F#m4","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"F#m4","color":"Blue, with Terra and Gold Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	{}	\N	t	\N	\N	\N	\N	\N	\N	\N	2025-05-24 14:29:45.029365	2025-07-25 07:50:31.14	t
362	SW-1609	6658906620235	Joriek Van landeghem	joriekvanlandeghem@gmail.com	+32497822254	Kerkstraat 23	Clinge	\N	4567 CJ	Netherlands	retail	f	\N	archived	2025-05-25 10:02:56	\N		0	{"type":"Innato Em4","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Em4","color":"Smokefired black with Terra and Copper Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	{}	\N	t	\N	\N	\N	\N	\N	\N	\N	2025-05-25 10:30:41.46394	2025-07-25 07:50:30.715	f
387	SW-1634	6728078229835	Rodrigo Kimelblat	rkimel@gmail.com	+61414024042	25 Fifth Ave, Semaphore Park SA 5019, Austrália	Semaphore Park	South Australia	5019	Australia	retail	f	\N	ordered	2025-06-27 06:57:44	\N	Need to be 432 Hz	0	{"type":"Innato G#m3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"G#m3","color":"Smokefired black with Terra and Copper Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-06-27 15:12:49.960821	2025-06-27 15:13:28.738	f
388	SW-1633	6727687012683	Spencer Merage	spencermu1@gmail.com	3039094022	4673 Eldorado Springs Dr	Boulder	Colorado	80303	United States	retail	f	\N	ordered	2025-06-26 21:23:38	\N		0	{"type":"Innato G#m3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"G#m3","color":"Smokefired Blue with Red and Bronze Bubbles","key":"432 Hz","fulfillable_quantity":"1"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-06-27 15:12:50.389113	2025-06-27 15:12:50.389113	f
386	SW-1632	6725867438411	Angel Agustin Jacky	agustinjacky@gmail.com	+41762610003	Nordstrasse 237, JACKY	8037 Zürich (ZH)	\N	8037	Switzerland	retail	f	\N	ordered	2025-06-25 21:52:36	\N		0	{"type":"Innato Am3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Am3","color":"Blue, with Terra and Gold Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-06-26 05:58:50.317129	2025-06-26 05:58:50.317129	f
389	SW-1636	6730553360715	Eva Miklosova	ashtangayogaeva@gmail.com	+33643779486	3 Boulevard de Riquier	Nice	\N	06300	France	retail	f	\N	ordered	2025-06-28 13:52:41	\N		0	{"type":"Innato Bm3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Bm3","color":"Blue, with Terra and Gold Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-06-29 05:52:03.744799	2025-06-29 05:52:03.744799	f
392	SW-1638	6735171912011	Echo Koo	cacaotree331@yahoo.com.hk	+85298397366	135 Junction Road	Kowloon Tsai	Kowloon	\N	Hong Kong	retail	f	\N	ordered	2025-07-01 08:13:55	\N		0	{"type":"Double Medium Native Cm4","model":"DOUBLE","fluteType":"DOUBLE","tuningFrequency":"440Hz","frequency":"440","tuning":"Cm4","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-07-01 17:54:25.070843	2025-07-01 17:54:25.070843	f
345	SW-1564	6546625626443	Katherine Perry	kateperry94@gmail.com	+17608556228	770 Avenida Codorniz	San Marcos	California	92069	United States	retail	f	\N	archived	2025-03-16 21:00:41	\N		0	{"type":"Innato Em4","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Em4","color":"Blue, with Terra and Gold Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	{}	\N	t	\N	\N	\N	\N	\N	\N	\N	2025-05-13 14:57:02.725452	2025-07-25 07:50:42.334	f
396	SW-1642	6740913619275	Caroline Henry	gazelle831@gmail.com	8312772594	1075 Makawao Ave, #509	Makawao	Hawaii	96768	United States	retail	f	\N	ordered	2025-07-04 03:41:08	\N		0	{"type":"Innato Dm4","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Dm4","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-07-04 08:03:55.948758	2025-07-04 08:03:55.948758	f
393	SW-1640	6738221728075	Elsemarieke Koppe	elsemarieke1@hotmail.com	+31652712045	444, Burgemeester caan van necklaan	Leidschendam	\N	2262 HE	Netherlands	retail	f	\N	ordered	2025-07-02 18:33:52	\N		0	{"type":"ZEN flute Large","model":"ZEN","fluteType":"ZEN","tuningFrequency":"440Hz","frequency":"440","tuning":"L","color":"Blue, with Terra and Gold Bubbles","fulfillable_quantity":"1"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-07-02 19:46:13.807845	2025-07-02 19:46:13.807845	f
359	SW-1605	6651912159563	Dusan Filimonovic	filimonovicdusan@gmail.com	+36306460342	Jozsef Attila 1/5, 27, Sgrt 27	Szeged	\N	6721	Hungary	retail	f	\N	archived	2025-05-21 13:14:35	\N		0	{"type":"Innato Dm4","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Dm4","color":"Smokefired Terra and Black","key":"440 Hz","fulfillable_quantity":"1"}	{}	\N	t	\N	\N	\N	\N	\N	\N	\N	2025-05-21 13:28:27.352815	2025-07-25 07:50:31.515	f
363	SW-1608	6658866151755	Simone van Bergen	s.vanbergen@telfort.nl	0616058713	Agnes Huijnstraat 2	Venlo	\N	5914 PE	Netherlands	retail	f	\N	archived	2025-05-25 09:37:11	\N		0	{"type":"Innato Exploration Cards","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","fulfillable_quantity":"1"}	{}	\N	t	\N	\N	\N	\N	\N	\N	\N	2025-05-25 10:30:41.868832	2025-07-25 07:50:30.905	f
344	SW-1565	6546879086923	Ellie Strange	elliestrange66@gmail.com	+447715643409	Flat 6, Winn Court, Winn Road	Southampton	England	SO17 1UZ	United Kingdom	retail	f	\N	archived	2025-03-17 07:14:20	\N		0	{"type":"Natey G#m4","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"G#m4","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	{}	\N	t	\N	\N	\N	\N	\N	\N	\N	2025-05-13 14:57:02.577508	2025-07-25 07:50:42.129	f
364	SW-1610	6660669997387	Geoffroy Dell'Aria	jef.triskell@hotmail.fr	+32474404509	Perkstraat 72	Sterrebeek	\N	1933	Belgium	retail	f	\N	archived	2025-05-26 01:06:05	\N		0	{"type":"Natey C#m4","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"C#m4","color":"Smokefired black with Terra and Copper Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	{}	\N	t	\N	\N	\N	\N	\N	\N	\N	2025-05-26 06:49:04.673483	2025-07-25 07:50:30.479	f
375	SW-1619	6697075245387	Nick Wobma	wobmanick@hotmail.com	+31641208088	Tetterode 24	Nieuw-Vennep	\N	2151 RD	Netherlands	retail	f	\N	archived	2025-06-12 10:47:38	\N		0	{"type":"Innato Am3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Am3","color":"Blue, with Terra and Gold Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-06-13 18:38:15.611955	2025-07-15 07:25:08.761	f
377	SW-1623	6704170795339	Nick Van Boekel	nickyvanboekel@gmail.com	0648108451	Pasteurstraat 111	Den Helder	\N	1782 JC	Netherlands	retail	f	\N	archived	2025-06-15 12:01:40	\N		0	{"type":"Natey G#m4","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"G#m4","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-06-16 07:17:28.70772	2025-07-15 12:53:15.513	f
368	SW-1611	6665855238475	Cleo Anderson	cleoanderson04@icloud.com	+447724191095	13 Haytor Close	Plymouth	England	PL5 3RW	United Kingdom	retail	f	\N	archived	2025-05-28 20:36:46	\N		0	{"type":"Natey Cm4","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"Cm4","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	{}	\N	t	\N	\N	\N	\N	\N	\N	\N	2025-05-30 05:39:12.032478	2025-07-25 07:50:30.29	f
378	SW-1624	6706139988299	Christina Co	christina@chcc.design	+6046160605	198 Aquarius Mews, 2503	Vancouver	British Columbia	V6J 1K1	Canada	retail	f	\N	archived	2025-06-16 07:40:09	\N		0	{"type":"Innato Bbm3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Bbm3","color":"Blue, with Terra and Gold Bubbles","key":"432 Hz","fulfillable_quantity":"1"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-06-16 11:24:20.539546	2025-07-25 07:48:31.243	f
340	SW-1570	6551805854027	Kerem Brule	kerembrule@gmail.com	+16195492924	1604 Northeast Bryant Street	Portland	Oregon	97211	United States	reseller	t	KEREM	archived	2025-03-20 17:58:08	\N		0	{"type":"Innato Dm4","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Dm4","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"0"}	{}	\N	t	\N	\N	\N	\N	\N	\N	\N	2025-05-13 14:57:01.845729	2025-05-13 18:11:59.398	f
370	SW-1616	6680911905099	zhu sheng	saintsqurilinrshen@gmail.com	+819096366688	Nakameguro 2-7-7, room1005 Residia Nakameguro 3	Meguro	Tōkyō	153-0061	Japan	retail	f	\N	archived	2025-06-05 03:30:23	\N		0	{"type":"Innato Am3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Am3","color":"Blue, with Terra and Gold Bubbles","key":"432 Hz","fulfillable_quantity":"1"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-06-05 05:07:50.045583	2025-07-14 15:11:50.625	f
369	SW-1615	6674486067531	Unknown Customer	\N	\N	\N	\N	\N	\N	\N	retail	t	IVO	archived	2025-06-03 07:20:47	\N	exchange Am3 1542	0	{"type":"Innato Am3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Am3","color":"Smokefired black with Terra and Copper Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-06-03 07:21:37.559836	2025-07-15 12:26:34.839	f
342	SW-1567	6549184807243	Jimmy Ward	jimmyward@outlook.com	07914945610	27 Brownleaf Road	Brighton and Hove	England	BN2 6LD	United Kingdom	retail	f	\N	archived	2025-03-18 19:01:22	\N		0	{"type":"Natey Am4","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"Am4","color":"Blue, with Terra and Gold Bubbles","key":"432 Hz","fulfillable_quantity":"1"}	{}	\N	t	\N	\N	\N	\N	\N	\N	\N	2025-05-13 14:57:02.285759	2025-07-25 07:50:41.741	f
367	SW-1612	6666870292811	Cassius Hirst	cassiushirst@gmail.com	07920024368	Thames Wharf Studios, Rainville Road	London	England	W6 9HA	United Kingdom	retail	f	\N	archived	2025-05-29 14:20:15	\N		0	{"type":"Innato Dm4","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Dm4","color":"Blue, with Terra and Gold Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-05-30 05:39:11.653789	2025-07-06 09:49:20.582	f
366	SW-1613	6666892476747	Patrycja Szczupak	asameesound@gmail.com	0642080287	Elviraland 64	Den Haag	\N	2591 GJ	Netherlands	retail	f	\N	archived	2025-05-29 14:32:39	\N		0	{"type":"Innato D#m4","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"D#m4","color":"Smokefired black with Terra and Copper Bubbles","key":"432 Hz","fulfillable_quantity":"1"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-05-30 05:39:11.27423	2025-07-06 09:49:20.629	f
365	SW-1614	6667532992843	Kerem Brule	kerembrule@gmail.com	+16195492924	7700 Park Ave.	Skokie	Illinois	60077	United States	reseller	t	KEREM	archived	2025-05-29 21:41:28	\N		0	{"type":"Innato Cm4","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Cm4","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-05-30 05:39:10.840077	2025-07-06 09:49:20.677	f
374	SW-1620	6697792471371	Merel Boelens	info@yoga-muse.nl	+3624815928	Hoevensestraat, 4	vught	\N	5262 LN	Netherlands	retail	f	\N	archived	2025-06-12 17:47:13	\N		0	{"type":"Innato Bbm3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Bbm3","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-06-13 18:38:15.473499	2025-07-15 07:25:08.9	f
373	SW-1621	6700228018507	Kerem Brule	kerembrule@gmail.com	+16195492924	75-5811 Melelina Street	Kailua-Kona	Hawaii	96740	United States	reseller	t	KEREM	archived	2025-06-13 18:36:35	\N		0	{"type":"Innato Dm4","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Dm4","color":"Blue, with Terra and Gold Bubbles","key":"432 Hz","fulfillable_quantity":"1"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-06-13 18:38:15.205276	2025-07-15 07:25:09.057	f
351	SW-1553	6530875687243	Lindsey Morris	lindseymorris777@gmail.com	+12089495413	1800 North New Hampshire Avenue, 114	Los Angeles	California	90027	United States	retail	f	\N	archived	2025-03-07 04:25:52	\N		0	{"type":"Natey Gm3","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"Gm3","color":"Smokefired Terra with Terra and bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	{}	\N	t	\N	\N	\N	\N	\N	\N	\N	2025-05-13 14:57:03.92344	2025-07-25 07:50:44.252	f
355	SW-1535	6454666559819	Katja Vonk	vonk.katja@hotmail.com	0610219196	Hanetangerweg 6, 6	Ter Apel	\N	9561 PE	Netherlands	retail	f	\N	archived	2025-01-27 18:18:31	\N		0	{"type":"Innato Exploration Cards","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","fulfillable_quantity":"1"}	{}	\N	t	\N	\N	\N	\N	\N	\N	\N	2025-05-13 14:57:04.917898	2025-07-25 07:50:45.682	f
376	SW-1622	6701868777803	Avi Pravijanti	avibasuki@yahoo.com	+6285774325836	via Sempione 10, Arona	Arona	Novara	28041	Italy	retail	f	\N	archived	2025-06-14 12:29:12	\N	Moet in juli verstuurd worden	0	{"type":"Innato Bbm3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Bbm3","color":"Smokefired Terra with Terra and bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	{}	\N	t	\N	\N	\N	\N	\N	\N	\N	2025-06-14 13:10:08.463332	2025-07-25 07:50:26.176	t
337	SW-1573	6556718399819	Hajo Seevers	hajo-seevers@web.de	+4915730023819	Südstrasse 3	Zürich	\N	8008	Switzerland	retail	f	\N	archived	2025-03-23 17:03:10	\N		0	{"type":"Innato Em4","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Em4","color":"Smokefired Terra and Black","key":"440 Hz","fulfillable_quantity":"0"}	{}	\N	t	\N	\N	\N	\N	\N	\N	\N	2025-05-13 14:57:01.347844	2025-05-13 14:57:18.587	f
334	SW-1576	6572894978379	Lucas Temple	lucas.van.temple@gmail.com	9046277455	72 Mandy Circle	Santa Rosa Beach	Florida	32459	United States	retail	f	\N	archived	2025-04-01 15:35:43	\N		0	{"type":"Natey Am4","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"Am4","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	{}	\N	t	\N	\N	\N	\N	\N	\N	\N	2025-05-13 14:57:00.899327	2025-07-25 07:50:39.775	f
356	SW-1518	6432498909515	Philipp Krause	philmalighta@icloud.com	01725162543	Erfurter Strasse 1	Dresden	\N	01127	Germany	retail	f	\N	archived	2025-01-12 07:08:23	\N		0	{"type":"Double Large Native Am3","model":"DOUBLE","fluteType":"DOUBLE","tuningFrequency":"440Hz","frequency":"440","tuning":"Am3","color":"Blue, with Terra and Gold Bubbles","key":"432 Hz","fulfillable_quantity":"0"}	{}	\N	t	\N	\N	\N	\N	\N	\N	\N	2025-05-13 14:57:05.355757	2025-05-13 14:57:17.307	f
329	SW-1582	6586534035787	Walter Nelson	cof40@yahoo.com	+13022704688	1051 Hickory Ridge Rd	Smyrna	Delaware	19977	United States	retail	f	\N	archived	2025-04-10 23:18:55	\N		0	{"type":"Natey Gm3","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"Gm3","color":"Blue, with Terra and Gold Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	{}	\N	t	286664376230	FedEx	https://www.fedex.com/fedextrack/?trknbr=286664376230	2025-05-11 20:17:40.21702	\N	out_for_delivery	\N	2025-05-13 14:57:00.105901	2025-07-25 07:50:38.732	f
353	SW-1546	6499079258443	Aleksei Kalibin	a.atomsky@me.com	+34675994126	Malagankatu 4c, 69	Helsinki	\N	00220	Finland	retail	f	\N	archived	2025-02-25 19:46:07	\N		0	{"type":"Innato Em3 (NEW)","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Em3","color":"Blue, with Terra and Gold Bubbles","key":"432 Hz","fulfillable_quantity":"1"}	{}	\N	t	\N	\N	\N	\N	\N	\N	\N	2025-05-13 14:57:04.353808	2025-07-25 07:50:44.874	f
354	SW-1537	6461164749131	Max Schwanekamp	max@schwanekamp.org	+15416537672	3151 Storey Blvd	Eugene	Oregon	97405	United States	retail	f	\N	archived	2025-02-01 18:42:49	\N	New shipping adress!!	0	{"type":"Innato Am3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Am3","color":"Blue, with Terra and Gold Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	{}	\N	t	\N	\N	\N	\N	\N	\N	\N	2025-05-13 14:57:04.745358	2025-07-25 07:50:45.448	f
385	SW-1631	6722958819659	Timothy Evans	tevans.esq@gmail.com	+15713344777	901 North Frederick Street	Arlington	Virginia	22205	United States	retail	f	\N	archived	2025-06-24 12:44:13	\N		0	{"type":"Innato Bm3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Bm3","color":"Smokefired black with Terra and Copper Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-06-24 17:09:50.798736	2025-07-25 07:48:32.527	f
332	SW-1578	6579398279499	Jessica Veksler	jessicaveksler@gmail.com	+14252601033	3833 Renton Ave S	Seattle	Washington	98108-1640	United States	retail	f	\N	archived	2025-04-06 05:18:28	\N		0	{"type":"Innato C#m4","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"C#m4","color":"Blue, with Terra and Gold Bubbles","key":"432 Hz","fulfillable_quantity":"1"}	{}	\N	t	\N	\N	\N	\N	\N	\N	\N	2025-05-13 14:57:00.59566	2025-07-25 07:50:39.398	f
336	SW-1574	6559540183371	Kerem Brule	kerembrule@gmail.com	+16195492924	9 Harbour Isle Drive East, Apt 102	Fort Pierce	Florida	34949	United States	retail	t	KEREM	archived	2025-03-25 16:28:18	\N	Misschien ander adress maandag versturen	0	{"type":"Innato Bm3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Bm3","color":"Blue, with Terra and Gold Bubbles","key":"432 Hz","fulfillable_quantity":"1"}	{}	\N	t	\N	\N	\N	\N	\N	\N	\N	2025-05-13 14:57:01.203439	2025-07-25 07:50:40.162	f
328	SW-1583	6587931033931	Brittney Barnes	brittney.barnes93@gmail.com	9733429982	380 MT PROSPECT AVE, APT 14B	Newark	New Jersey	07104	United States	retail	f	\N	archived	2025-04-12 02:57:45	\N		0	{"type":"Innato Exploration Cards","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","fulfillable_quantity":"1"}	{}	\N	t	05112925388941	DPD	https://tracking.dpd.de/status/05112925388941	2025-05-13 20:17:40.21702	\N	in_transit	\N	2025-05-13 14:56:59.957855	2025-07-25 07:50:38.542	f
352	SW-1548	6501454086475	Miklós Heim-Tóth	miklos.toth2@gmail.com	+36704253440	Fő utca 89	Barnag	\N	8291	Hungary	retail	f	\N	archived	2025-02-27 11:06:21	\N		0	{"type":"Innato Am3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Am3","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	{}	\N	t	\N	\N	\N	\N	\N	\N	\N	2025-05-13 14:57:04.150153	2025-07-25 07:50:44.638	f
371	SW-1617	6682316538187	Ivo Sedlacek	info@savita.cz	+420603481984	V Aleji 42	Jablonec nad Nisou	\N	466 01	Czech Republic	reseller	t	IVO	archived	2025-06-05 12:43:59	\N		0	{"type":"Double Large Native Gm3","model":"DOUBLE","fluteType":"DOUBLE","tuningFrequency":"440Hz","frequency":"440","tuning":"Gm3","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-06-05 12:44:57.353778	2025-07-06 09:49:20.821	f
333	SW-1577	6573507641675	Mia Malcyone	mia@ecospace.se	+46707515776	Synålsvägen 21	Bromma	\N	168 73	Sweden	retail	f	\N	archived	2025-04-02 01:15:41	\N		0	{"type":"Innato Em4","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Em4","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	{}	\N	t	\N	\N	\N	\N	\N	\N	\N	2025-05-13 14:57:00.749822	2025-07-25 07:50:39.587	f
346	SW-1563	6546511200587	Lotus Shields	shieldslotus@gmail.com	+447724084325	38 Trafalgar way	Braintree	England	CM7 9UX	United Kingdom	retail	f	\N	archived	2025-03-16 19:38:36	\N		0	{"type":"Innato Cm4","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Cm4","color":"Smokefired black with Terra and Copper Bubbles","key":"440 Hz","fulfillable_quantity":"0"}	{}	\N	t	\N	\N	\N	\N	\N	\N	\N	2025-05-13 14:57:02.872681	2025-05-13 14:57:18.041	f
380	SW-1626	6717919592779	Robin Wessels	robin.wessels@hotmail.com	+41795476322	Auwisstrasse 35	Saland	\N	8493	Switzerland	retail	f	\N	archived	2025-06-21 11:44:13	\N		0	{"type":"Innato Dm4","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Dm4","color":"Blue, with Terra and Gold Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-06-21 12:34:59.221761	2025-07-25 07:48:31.386	f
330	SW-1580	6585441255755	Iselin Grayston	iselin.grayston@gmail.com	+4799323643	Ramshaugvegen 24	Bryne	\N	4340	Norway	retail	f	\N	archived	2025-04-10 09:24:28	\N		0	{"type":"Innato Cm4","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Cm4","color":"Blue, with Terra and Gold Bubbles","key":"432 Hz","fulfillable_quantity":"1"}	{}	\N	t	\N	\N	\N	\N	\N	\N	\N	2025-05-13 14:57:00.270412	2025-07-25 07:50:38.966	f
357	SW-1515	6428373549387	Marvin Schwarz	kalleklopps00@gmail.com	+491781135275	Hauptstraße 9	Göggingen	\N	73571	Germany	retail	f	\N	archived	2025-01-08 23:34:22	\N		0	{"type":"Double Medium Native Bbm3","model":"DOUBLE","fluteType":"DOUBLE","tuningFrequency":"440Hz","frequency":"440","tuning":"Bbm3","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"0"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-05-13 15:18:48.479108	2025-06-06 06:20:19.521	t
348	SW-1560	6544442523979	Billy Zanski	info@skinnybeatsdrums.com	\N	4 Eagle Street	Asheville	North Carolina	28801	United States	reseller	t	BILLY	archived	2025-03-15 11:48:32	\N	Samen	0	{"type":"Innato Am3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Am3","color":"Blue, with Terra and Gold Bubbles","key":"440 Hz","fulfillable_quantity":"0"}	{}	\N	t	\N	\N	\N	\N	\N	\N	\N	2025-05-13 14:57:03.189607	2025-07-25 07:50:43.202	f
372	SW-1618	6687829229899	Amelia Meath	amelia.meath@gmail.com	+16174605965	8518 Meadow Ridge Lane	Chapel Hill	North Carolina	27516	United States	retail	f	\N	archived	2025-06-07 16:06:40	\N		0	{"type":"Innato C#m4","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"C#m4","color":"Blue, with Terra and Gold Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-06-07 19:04:07.962406	2025-07-09 10:25:32.862	f
349	SW-1559	6544418373963	Billy Zanski	info@skinnybeatsdrums.com	\N	4 Eagle Street	Asheville	North Carolina	28801	United States	reseller	t	BILLY	archived	2025-03-15 11:33:37	\N	Samen	0	{"type":"Innato Am3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Am3","color":"Blue, with Terra and Gold Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	{}	\N	t	\N	\N	\N	\N	\N	\N	\N	2025-05-13 14:57:03.442829	2025-07-25 07:50:43.535	f
350	SW-1557	6537826173259	Raquel Jensen	rjrpaintings@gmail.com	2064464150	4213 Basswood Rd	Freeland	Washington	98249	United States	retail	f	\N	archived	2025-03-10 22:15:55	\N	Got lost in shipping 	0	{"type":"Innato Am3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Am3","color":"Smokefired Terra with Terra and bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	{}	\N	t	\N	\N	\N	\N	\N	\N	\N	2025-05-13 14:57:03.722203	2025-07-25 07:50:43.918	t
381	SW-1627	6718134485323	Caitlin Veenendaal	cveenendaal@gmail.com	+31619536734	Bertha von Suttnerstraat 21	Arnhem	\N	6836 KL	Netherlands	retail	f	\N	archived	2025-06-21 13:30:12	\N		0	{"type":"Innato Am3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Am3","color":"Smokefired Blue with Red and Bronze Bubbles","key":"432 Hz","fulfillable_quantity":"1"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-06-21 21:39:25.905322	2025-07-25 07:48:31.528	f
379	SW-1625	6714818888011	Luisa Büttel	l.buettel@t-online.de	015115241722	Augustinerstraße 30	Mainz	\N	55116	Germany	retail	f	\N	archived	2025-06-19 19:32:02	\N		0	{"type":"Natey Em4","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"Em4","color":"Smokefired Blue with Red and Bronze Bubbles","key":"432 Hz","fulfillable_quantity":"1"}	{}	\N	t	\N	\N	\N	\N	\N	\N	\N	2025-06-21 05:40:04.174325	2025-07-25 07:50:25.092	f
347	SW-1561	6544465592651	Alejandro De Antonio	aldeantonioluthier@gmail.com	680697219	Calle Real 39B	Cañicosa	Segovia	40163	Spain	retail	f	\N	archived	2025-03-15 12:03:13	\N		0	{"type":"Innato Bm3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Bm3","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	{}	\N	t	\N	\N	\N	\N	\N	\N	\N	2025-05-13 14:57:03.043282	2025-07-25 07:50:43.007	f
383	SW-1628	6721879376203	marina dente	marinadente@hotmail.it	+393392438362	Via di Vigna Fabbri, 14	Roma	Roma	00179	Italy	retail	f	\N	archived	2025-06-23 18:25:09	\N		0	{"type":"Innato Bbm3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Bbm3","color":"Blue, with Terra and Gold Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-06-24 08:26:40.017301	2025-07-25 07:48:31.672	f
382	SW-1629	6722394161483	Robert Tannemaat	robert@samenzijn.nu	+31642921684	Mirtestraat, 1	Nijmegen	\N	6542 ML	Netherlands	retail	f	\N	archived	2025-06-24 06:13:27	\N		0	{"type":"Innato Am3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Am3","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-06-24 08:26:39.489549	2025-07-25 07:48:31.814	f
384	SW-1630	6722689761611	Alan Tower	alan@soundforlife.fun	+14153052489	2045 Meridian Ave, Unit A	South Pasadena	California	91030	United States	retail	t	ALAN	archived	2025-06-24 09:54:38	\N		0	{"type":"Innato Am3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Am3","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-06-24 10:49:27.705996	2025-07-25 07:48:31.958	f
17	SW-1585	6590855250251	John Martin	jdalmartin@hotmail.com	2503338599	561 NOOTKA RD, Nootka Road	QUALICUM BEACH	British Columbia	V9K 1A3	Canada	retail	f	\N	archived	2025-04-13 22:26:16	\N		0	{"type":"Innato Dm4","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Dm4","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	{}	\N	t	05112925388969	DPD	https://tracking.dpd.de/status/05112925388969	2025-05-02 20:17:40.21702	\N	delivered	2025-05-09 20:17:40.21702	2025-05-13 14:49:23.054115	2025-07-25 07:50:36.87	f
394	SW-1639	6737925636427	Anne Nymark	annenymark@gmail.com	+358405203354	Sorsantie, 11	Vaasa	\N	65230	Finland	retail	f	\N	ordered	2025-07-02 16:30:30	\N		0	{"type":"ZEN flute Medium","model":"ZEN","fluteType":"ZEN","tuningFrequency":"440Hz","frequency":"440","tuning":"M","color":"Smokefired Terra and Black","fulfillable_quantity":"1"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-07-02 19:46:14.23933	2025-07-02 19:46:14.23933	f
9	SW-1594	6623199691083	Alan Tower	alan@theresonancecenter.com	\N	2045 Meridian Avenue, Apt A	South Pasadena	California	91030	United States	retail	t	ALAN	archived	2025-05-04 20:19:07	\N		0	{"type":"Innato Am3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Am3","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	{}	\N	t	\N	\N	\N	\N	\N	\N	\N	2025-05-13 14:49:21.175979	2025-07-25 07:50:34.729	f
331	SW-1579	6584069357899	Jacob Glum	autrix94@gmail.com	18453137099	11 Horicon Ave, apt 1	Warrensburg	New York	12885	United States	retail	f	\N	archived	2025-04-09 10:33:04	\N		0	{"type":"Innato Bbm3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Bbm3","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	{}	\N	t	\N	\N	\N	\N	\N	\N	\N	2025-05-13 14:57:00.452109	2025-07-25 07:50:39.208	f
11	SW-1592	6617593643339	Susanna Gutmann	susanna.gutmann@gmail.com	+4367764111839	Kleinschoenau 37	Zwettl-Niederösterreich	\N	3533	Austria	retail	f	\N	archived	2025-05-01 11:37:56	\N		0	{"type":"Innato Bm3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Bm3","color":"Smokefired black with Terra and Copper Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	{}	\N	t	\N	\N	\N	\N	\N	\N	\N	2025-05-13 14:49:21.96933	2025-07-25 07:50:35.623	f
402	SW-1648	6770094211403	Jessica McEwin	jessicamcewin4@gmail.com	+61419404823	LOT 3915 KLENK STREET, Suite 1283	Karratha	Western Australia	6714	Australia	retail	f	\N	ordered	2025-07-20 02:30:28	\N		0	{"type":"Innato Em4","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Em4","color":"Blue, with Terra and Gold Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-07-20 08:55:06.450237	2025-07-20 08:55:06.450237	f
13	SW-1590	6604801507659	Brennan Gudmundson	brennanmg1@gmail.com	(312) 848-0001	1307 West Erie Street, 2	Chicago	Illinois	60642	United States	retail	f	\N	archived	2025-04-23 03:26:37	\N		0	{"type":"Innato Em4","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Em4","color":"Blue, with Terra and Gold Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	{}	\N	t	\N	\N	\N	\N	\N	\N	\N	2025-05-13 14:49:22.316765	2025-07-25 07:50:36.065	f
341	SW-1568	6550745678155	Becky Hayling	meempster@gmail.com	07754220937	56 Cotswold Road	Bath	England	BA2 2DL	United Kingdom	retail	f	\N	archived	2025-03-19 22:20:41	\N		0	{"type":"Innato Cm4","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Cm4","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	{}	\N	t	\N	\N	\N	\N	\N	\N	\N	2025-05-13 14:57:02.117807	2025-07-25 07:50:41.551	f
397	SW-1643	6744737153355	Jade Moisan	zultattoo@gmail.com	+33618444716	8 Rue du Moulin, Chez Alain Moisan	Mesland	\N	41150	France	retail	f	\N	ordered	2025-07-05 21:48:11	\N		0	{"type":"Natey Am4","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"Am4","color":"Blue, with Terra and Gold Bubbles","key":"432 Hz","fulfillable_quantity":"1"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-07-06 09:14:14.447187	2025-07-06 09:14:14.447187	f
398	SW-1644	6758829162827	Michaela Flegel	michaela_flegel@hotmail.com	+4917626234541	Rosselstrasse 16	Wiesbaden	\N	65193	Germany	retail	f	\N	ordered	2025-07-13 10:46:30	\N	Add free Innato cards!	0	{"type":"ZEN flute Medium","model":"ZEN","fluteType":"ZEN","tuningFrequency":"440Hz","frequency":"440","tuning":"M","color":"Smokefired Terra and Black","fulfillable_quantity":"1"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-07-13 16:29:32.235151	2025-07-13 16:30:36.216	f
400	SW-1646	6763953324363	Ivo Sedlacek	info@savita.cz	+420603481984	V Aleji 42	Jablonec nad Nisou	\N	466 01	Czech Republic	reseller	t	IVO	ordered	2025-07-16 09:21:15	\N		0	{"type":"Natey Am4","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"Am4","color":"Blue, with Terra and Gold Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-07-16 09:32:43.922202	2025-07-16 09:32:43.922202	f
10	SW-1593	6621806330187	Vittorio Cova	vitcovacova@gmail.com	+18325065139	5651 Doliver Drive	Houston	Texas	77056	United States	retail	f	\N	archived	2025-05-03 23:42:49	\N		0	{"type":"Innato Gm3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Gm3","color":"Smokefired Terra with Terra and bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	{}	\N	t	\N	\N	\N	\N	\N	\N	\N	2025-05-13 14:49:21.796923	2025-07-25 07:50:35.436	f
335	SW-1575	6572002148683	Marc Footman	marc_footman@hotmail.com	+447415129883	89, Parkside Crescent	Telford	England	TF1 5GT	United Kingdom	retail	f	\N	archived	2025-04-01 00:04:10	\N		0	{"type":"Natey Dm4","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"Dm4","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	{}	\N	t	\N	\N	\N	\N	\N	\N	\N	2025-05-13 14:57:01.054073	2025-07-25 07:50:39.971	f
338	SW-1572	6552928977227	Thea Seuntiëns	thea_seuntiens@hotmail.com	+31402041423	Henry Hudsonhof 15	Valkenswaard	\N	5554 PC	Netherlands	retail	f	\N	archived	2025-03-21 14:39:01	\N		0	{"type":"Natey Cm4","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"Cm4","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	{}	\N	t	\N	\N	\N	\N	\N	\N	\N	2025-05-13 14:57:01.499467	2025-07-25 07:50:40.779	f
339	SW-1571	6551888167243	Nicholas Evers	nicoeversdesign@gmail.com	(415) 298-1608	1604 NE Bryant st.	Portland	Oregon	97211	United States	retail	f	\N	archived	2025-03-20 18:58:15	\N		0	{"type":"Innato Dm4","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Dm4","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	{}	\N	t	\N	\N	\N	\N	\N	\N	\N	2025-05-13 14:57:01.669053	2025-07-25 07:50:40.976	f
343	SW-1566	6547863568715	R Frijns	rfrijns@planet.nl	+31650976676	Professor Huetlaan 17	Laag-Soeren	\N	6957 AP	Netherlands	retail	f	\N	archived	2025-03-17 18:35:51	\N		0	{"type":"Natey Am3","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"Am3","color":"Smokefired Terra with Terra and bronze Bubbles","key":"432 Hz","fulfillable_quantity":"1"}	{}	\N	t	\N	\N	\N	\N	\N	\N	\N	2025-05-13 14:57:02.431922	2025-07-25 07:50:41.93	f
12	SW-1591	6605962412363	Marta paccagnella	paccagn@gmail.com	+447751773744	Flat 4 Banfield House, 4 Troubridge Square	London	England	E17 3GQ	United Kingdom	retail	f	\N	archived	2025-04-23 18:24:11	\N		0	{"type":"ZEN flute Large","model":"ZEN","fluteType":"ZEN","tuningFrequency":"440Hz","frequency":"440","tuning":"L","color":"Blue, with Terra and Gold Bubbles","fulfillable_quantity":"1"}	{}	\N	t	\N	\N	\N	\N	\N	\N	\N	2025-05-13 14:49:22.137322	2025-07-25 07:50:35.814	f
327	SW-1584	6588193243467	Holly Mckenzie	thundertrix@yahoo.co.uk	+447904744950	14 Bridgend	Dunblane	Scotland	FK15 9ES	United Kingdom	retail	f	\N	archived	2025-04-12 09:02:34	\N		0	{"type":"ZEN flute Medium","model":"ZEN","fluteType":"ZEN","tuningFrequency":"440Hz","frequency":"440","tuning":"M","color":"Smokefired Terra and Black","fulfillable_quantity":"1"}	{}	\N	t	286664231072	FedEx	https://www.fedex.com/fedextrack/?trknbr=286664231072	2025-04-25 20:17:40.21702	\N	delivered	2025-05-02 20:17:40.21702	2025-05-13 14:56:59.802538	2025-07-25 07:50:38.352	f
399	SW-1645	6763080057163	Teddy Ros	ros_teddy@yahoo.fr	+41766905881	chemin du petit clos 16	Clarens	\N	1815	Switzerland	retail	f	\N	ordered	2025-07-15 17:30:13	\N	send with 1647 ted ross	0	{"type":"Natey Am4","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"Am4","color":"Smokefired Terra with Terra and bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-07-16 06:05:34.328978	2025-07-17 14:36:03.086	f
401	SW-1647	6766192132427	Teddy Ros	ros_teddy@yahoo.fr	+41766905881	chemin du petit clos 16	Clarens	\N	1815	Switzerland	retail	f	\N	ordered	2025-07-17 14:05:39	\N	send with 1645 ted ross	0	{"type":"Innato Em4","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Em4","color":"Blue, with Terra and Gold Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-07-17 14:10:01.45721	2025-07-17 14:36:06.94	f
395	SW-1641	6740376650059	Paolo Altruda	paoloaltruda13@gmail.com	07595326124	Elmore Court, Elmore	Gloucester	England	GL2 3NT	United Kingdom	retail	f	\N	archived	2025-07-03 17:53:50	\N	Direct versturen! Is al gemaakt 	0	{"type":"Natey Am3","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"Am3","color":"Smokefired black with Terra and Copper Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	{}	\N	t	\N	\N	\N	\N	\N	\N	\N	2025-07-03 17:54:39.357761	2025-07-25 07:54:11.116	t
403	SW-1649	6786327052619	Sierra Ward	sierrasovereign@gmail.com	+19494632664	810 Baker St, 208	Costa Mesa	California	92626	United States	retail	f	\N	ordered	2025-07-25 01:34:16	\N		0	{"type":"Innato Cm4","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Cm4","color":"Blue, with Terra and Gold Bubbles","key":"432 Hz","fulfillable_quantity":"1"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-07-25 06:43:42.60645	2025-07-25 06:43:42.60645	f
\.


--
-- Data for Name: production_notes; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.production_notes (id, order_id, item_id, note, created_by, source, created_at) FROM stdin;
1	1	1	Order validated and materials reserved	system	internal	2025-05-02 10:30:00
2	1	1	Started building process for Innato A3	Marco	internal	2025-05-03 14:45:00
\.


--
-- Data for Name: resellers; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.resellers (id, name, nickname, business_name, contact_name, email, phone, address, city, state, zip, country, discount_percentage, is_active, notes, last_order_date, created_at, updated_at) FROM stdin;
15	Melody Market	MelodyMkt	Melody Market LLC	John Smith	contact@melodymarket.com	+1-555-123-4567	123 Music Lane	Harmony	CA	90001	USA	15	t	Primary reseller for California region	\N	2025-05-13 15:24:14.062012	2025-05-13 15:24:14.062012
16	Harmony House	HarmonyHs	Harmony House Inc	Jane Doe	jane@harmonyhouse.com	+1-555-987-6543	456 Tune Avenue	Musicville	NY	10001	USA	10	t	East coast distributor	\N	2025-05-13 15:24:14.062012	2025-05-13 15:24:14.062012
17	Mystical Sounds	MystSound	Mystical Sounds GmbH	Hans Mueller	info@mysticalsounds.de	+49-555-1234	Klangstrasse 78	Berlin	BE	10115	Germany	20	t	European distributor	\N	2025-05-13 15:24:14.062012	2025-05-13 15:24:14.062012
25	BILLY	BILLY	\N	Billy Zanski	info@skinnybeatsdrums.com		4 Eagle Street	Asheville	North Carolina	28801	United States	0	t	Auto-created from order 349	\N	2025-05-13 18:01:56.792	2025-05-13 18:01:56.792
26	ALAN	ALAN	\N	Alan Tower	alan@theresonancecenter.com		2045 Meridian Avenue, Apt A	South Pasadena	California	91030	United States	0	t	Auto-created from order 9	\N	2025-05-13 18:02:14.218	2025-05-13 18:02:14.218
27	KEREM	KEREM	\N	Kerem Brule	kerembrule@gmail.com	+16195492924	9 Harbour Isle Drive East, Apt 102	Fort Pierce	Florida	34949	United States	0	t	Auto-created from order 336	\N	2025-05-13 18:02:56.826	2025-05-13 18:02:56.826
28	IVO	IVO	\N	Ivo Sedlacek	info@savita.cz	+420603481984	V Aleji 42	Jablonec nad Nisou		466 01	Czech Republic	0	t	Auto-created from order 358	\N	2025-05-21 07:09:02.428	2025-05-21 07:09:02.428
29	MITIA	MITIA	\N	Mitia Klein	mitiaklein24@gmail.com	+33603388169	, 27 rue des entrepots	saint quen sur seine		93400	Netherlands	0	t	Auto-created from order 361	\N	2025-05-24 14:30:51.72	2025-05-24 14:30:51.72
30	ALANALAN	ALANALAN	\N	Alan Tower	alan@soundforlife.fun	+14153052489	2045 Meridian Ave, Unit A	South Pasadena	California	91030	United States	0	t	Auto-created from order 384	\N	2025-06-26 06:00:08.253	2025-06-26 06:00:08.253
\.


--
-- Data for Name: session; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.session (sid, sess, expire) FROM stdin;
wAbVbos4PkDXkIgyR-sJsAxWajvytvzQ	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-08-05T11:17:07.143Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":4}}	2025-08-24 07:54:12
fVVbFg8L7C_aWqTaZsCwVcGXRjvN-4Ns	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-08-08T10:25:59.886Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":4}}	2025-08-17 12:59:23
Omxp_JVo0auBAgR3KwLFb-koUk8dCA8Y	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-08-08T14:28:20.793Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":4}}	2025-08-16 14:46:12
LFVWRRuU1Wc7pPFl0kgYWyscctNKl_ZP	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-08-05T12:07:15.158Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":4}}	2025-08-24 07:50:47
SJ6VuAbSPKiMVecT-mWla-RqB2MQ3mTE	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-08-05T10:04:56.599Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":4}}	2025-08-05 11:19:51
\.


--
-- Data for Name: shopify_item_tracking; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) FROM stdin;
16	17	[1]	[{"shopifyLineItemId":"16574528029003","suffix":1,"title":"Innato Dm4"}]	2025-05-13 14:49:23.105	2025-07-04 11:47:50.861
328	333	[1]	[{"shopifyLineItemId":"16538871071051","suffix":1,"title":"Innato Em4"}]	2025-05-13 14:57:00.798	2025-05-17 07:45:06.496
382	387	[1]	[{"shopifyLineItemId":"16853787050315","suffix":1,"title":"Innato G#m3"}]	2025-06-27 15:12:50.12	2025-07-25 07:54:12.107
2	3	[1]	[{"shopifyLineItemId":"16665201705291","suffix":1,"title":"Natey Am4"}]	2025-05-13 14:49:20.181	2025-07-11 07:17:10.961
371	376	[1]	[{"shopifyLineItemId":"16798170939723","suffix":1,"title":"Innato Bbm3"}]	2025-06-14 13:10:08.635	2025-07-15 11:15:09.397
330	335	[1]	[{"shopifyLineItemId":"16535593353547","suffix":1,"title":"Natey Dm4"}]	2025-05-13 14:57:01.102	2025-05-17 07:45:06.771
322	327	[1]	[{"shopifyLineItemId":"16569193529675","suffix":1,"title":"ZEN flute Medium"}]	2025-05-13 14:56:59.854	2025-07-04 11:47:51.274
335	340	[1]	[{"shopifyLineItemId":"16494657077579","suffix":1,"title":"Innato Dm4"}]	2025-05-13 14:57:01.898	2025-07-25 07:50:41.358
11	12	[1]	[{"shopifyLineItemId":"16604072411467","suffix":1,"title":"ZEN flute Large"}]	2025-05-13 14:49:22.188	2025-07-04 11:47:48.731
383	388	[1]	[{"shopifyLineItemId":"16852999209291","suffix":1,"title":"Innato G#m3"}]	2025-06-27 15:12:50.516	2025-07-25 07:54:12.243
326	331	[1]	[{"shopifyLineItemId":"16560707633483","suffix":1,"title":"Innato Bbm3"}]	2025-05-13 14:57:00.498	2025-06-08 07:58:44.847
327	332	[1]	[{"shopifyLineItemId":"16550977012043","suffix":1,"title":"Innato C#m4"}]	2025-05-13 14:57:00.644	2025-06-08 07:58:45.254
334	339	[1]	[{"shopifyLineItemId":"16494827569483","suffix":1,"title":"Innato Dm4"}]	2025-05-13 14:57:01.724	2025-05-17 07:45:07.309
329	334	[1]	[{"shopifyLineItemId":"16537558319435","suffix":1,"title":"Natey Am4"}]	2025-05-13 14:57:00.953	2025-06-08 07:58:45.842
325	330	[1,2]	[{"shopifyLineItemId":"16563508445515","suffix":1,"title":"Innato Cm4"},{"shopifyLineItemId":"16563508478283","suffix":2,"title":"Innato Fm3"}]	2025-05-13 14:57:00.354	2025-07-15 11:49:52.104
368	373	[1]	[{"shopifyLineItemId":"16794782007627","suffix":1,"title":"Innato Dm4"}]	2025-06-13 18:38:15.361	2025-07-25 07:50:26.557
9	10	[1]	[{"shopifyLineItemId":"16634801291595","suffix":1,"title":"Innato Gm3"}]	2025-05-13 14:49:21.848	2025-07-09 14:28:23.93
377	382	[1]	[{"shopifyLineItemId":"16841887646027","suffix":1,"title":"Innato Am3"}]	2025-06-24 08:26:39.67	2025-07-25 07:50:23.49
7	8	[1]	[{"shopifyLineItemId":"16643297050955","suffix":1,"title":"Natey G#m4"}]	2025-05-13 14:49:21.065	2025-07-15 11:15:20.443
14	15	[1]	[{"shopifyLineItemId":"16590322794827","suffix":1,"title":"Natey G#m4"}]	2025-05-13 14:49:22.74	2025-07-15 11:15:22.553
6	7	[1]	[{"shopifyLineItemId":"16646644695371","suffix":1,"title":"Natey Cm4"}]	2025-05-13 14:49:20.875	2025-07-11 07:17:12.675
398	403	[1]	[{"shopifyLineItemId":"16963607527755","suffix":1,"title":"Innato Cm4"}]	2025-07-25 06:43:42.739	2025-07-25 07:54:09.849
333	338	[1]	[{"shopifyLineItemId":"16496935403851","suffix":1,"title":"Natey Cm4"}]	2025-05-13 14:57:01.551	2025-06-08 07:58:47.171
369	374	[1]	[{"shopifyLineItemId":"16789943058763","suffix":1,"title":"Innato Bbm3"}]	2025-06-13 18:38:15.514	2025-07-25 07:50:26.985
324	329	[1]	[{"shopifyLineItemId":"16565900673355","suffix":1,"title":"Natey Gm3"}]	2025-05-13 14:57:00.152	2025-07-15 11:15:23.793
336	341	[1]	[{"shopifyLineItemId":"16492498616651","suffix":1,"title":"Innato Cm4"}]	2025-05-13 14:57:02.173	2025-05-17 07:45:07.578
337	342	[1]	[{"shopifyLineItemId":"16489221980491","suffix":1,"title":"Natey Am4"}]	2025-05-13 14:57:02.333	2025-05-17 07:45:07.717
338	343	[1]	[{"shopifyLineItemId":"16486560072011","suffix":1,"title":"Natey Am3"}]	2025-05-13 14:57:02.479	2025-05-17 07:45:07.855
339	344	[1]	[{"shopifyLineItemId":"16484188782923","suffix":1,"title":"Natey G#m4"}]	2025-05-13 14:57:02.625	2025-05-17 07:45:07.994
340	345	[1]	[{"shopifyLineItemId":"16483698901323","suffix":1,"title":"Innato Em4"}]	2025-05-13 14:57:02.772	2025-05-17 07:45:08.13
354	359	[1]	[{"shopifyLineItemId":"16694270427467","suffix":1,"title":"Innato Dm4"}]	2025-05-21 13:28:27.479	2025-07-15 11:15:16.202
370	375	[1]	[{"shopifyLineItemId":"16788418462027","suffix":1,"title":"Innato Am3"}]	2025-06-13 18:38:15.652	2025-07-25 07:50:27.417
12	13	[1]	[{"shopifyLineItemId":"16601674613067","suffix":1,"title":"Innato Em4"}]	2025-05-13 14:49:22.377	2025-07-04 11:47:49.151
5	6	[1]	[{"shopifyLineItemId":"16652674072907","suffix":1,"title":"Innato Fm3"}]	2025-05-13 14:49:20.7	2025-07-25 07:50:34.21
397	402	[1]	[{"shopifyLineItemId":"16938621698379","suffix":1,"title":"Innato Em4"}]	2025-07-20 08:55:06.589	2025-07-25 07:54:09.991
381	386	[1,2]	[{"shopifyLineItemId":"16849088282955","suffix":1,"title":"Innato Am3"},{"shopifyLineItemId":"16849088315723","suffix":2,"title":"Natey Dm4"}]	2025-06-26 05:58:50.57	2025-07-25 07:54:12.391
15	16	[1]	[{"shopifyLineItemId":"16587053236555","suffix":1,"title":"ZEN flute Medium"}]	2025-05-13 14:49:22.943	2025-07-04 15:08:23.558
331	336	[1]	[{"shopifyLineItemId":"16509335044427","suffix":1,"title":"Innato Bm3"}]	2025-05-13 14:57:01.25	2025-07-04 15:02:51.17
1	2	[1]	[{"shopifyLineItemId":"16667050344779","suffix":1,"title":"Natey F#m4"}]	2025-05-13 14:49:20.008	2025-07-15 11:15:18.314
3	4	[1]	[{"shopifyLineItemId":"16661413200203","suffix":1,"title":"Natey Am4"}]	2025-05-13 14:49:20.359	2025-07-15 11:15:18.946
4	5	[1]	[{"shopifyLineItemId":"16655963980107","suffix":1,"title":"Innato Gm3"}]	2025-05-13 14:49:20.52	2025-07-15 11:15:19.375
332	337	[1]	[{"shopifyLineItemId":"16503235281227","suffix":1,"title":"Innato Em4"}]	2025-05-13 14:57:01.394	2025-07-25 07:50:40.634
323	328	[1]	[{"shopifyLineItemId":"16568669241675","suffix":1,"title":"Innato Exploration Cards"}]	2025-05-13 14:57:00.005	2025-07-13 19:27:08.391
396	401	[1]	[{"shopifyLineItemId":"16930952216907","suffix":1,"title":"Innato Em4"}]	2025-07-17 14:10:01.632	2025-07-25 07:54:10.127
378	383	[1]	[{"shopifyLineItemId":"16840737751371","suffix":1,"title":"Innato Bbm3"}]	2025-06-24 08:26:40.143	2025-07-25 07:50:23.962
393	398	[1]	[{"shopifyLineItemId":"16916108443979","suffix":1,"title":"ZEN flute Medium"}]	2025-07-13 16:29:32.377	2025-07-25 07:54:10.781
13	14	[1]	[{"shopifyLineItemId":"16590850326859","suffix":1,"title":"Natey Dm4"}]	2025-05-13 14:49:22.562	2025-07-04 15:02:47.09
375	380	[1]	[{"shopifyLineItemId":"16832163578187","suffix":1,"title":"Innato Dm4"}]	2025-06-21 12:34:59.373	2025-07-25 07:50:24.905
350	355	[1]	[{"shopifyLineItemId":"16304363110731","suffix":1,"title":"Innato Exploration Cards"}]	2025-05-13 14:57:04.966	2025-05-13 14:57:04.966
352	357	[1]	[{"shopifyLineItemId":"16251654799691","suffix":1,"title":"Double Medium Native Bbm3"}]	2025-05-13 15:18:48.603	2025-07-08 13:11:25.006
380	385	[1]	[{"shopifyLineItemId":"16843095572811","suffix":1,"title":"Innato Bm3"}]	2025-06-24 17:09:50.917	2025-07-25 07:50:21.759
379	384	[1,2,3,4,5,6,7,8,9,10]	[{"shopifyLineItemId":"16842507157835","suffix":1,"title":"Innato Am3"},{"shopifyLineItemId":"16842507190603","suffix":2,"title":"Innato Am3"},{"shopifyLineItemId":"16842507223371","suffix":3,"title":"Innato Bbm3"},{"shopifyLineItemId":"16842507256139","suffix":4,"title":"Innato Bbm3"},{"shopifyLineItemId":"16842507288907","suffix":5,"title":"Innato Cm4"},{"shopifyLineItemId":"16842507321675","suffix":6,"title":"Innato Cm4"},{"shopifyLineItemId":"16842507354443","suffix":7,"title":"Innato Cm4"},{"shopifyLineItemId":"16842507387211","suffix":8,"title":"Innato Dm4"},{"shopifyLineItemId":"16842507419979","suffix":9,"title":"Innato Bm3"},{"shopifyLineItemId":"16919344120139","suffix":10,"title":"Innato Dm4"}]	2025-06-24 10:49:28.668	2025-07-25 07:50:22.137
376	381	[1]	[{"shopifyLineItemId":"16832614039883","suffix":1,"title":"Innato Am3"}]	2025-06-21 21:39:26.078	2025-07-25 07:50:24.43
365	370	[1]	[{"shopifyLineItemId":"16754237145419","suffix":1,"title":"Innato Am3"}]	2025-06-05 05:07:50.21	2025-07-25 07:50:28.637
364	369	[1]	[{"shopifyLineItemId":"16739224912203","suffix":1,"title":"Innato Am3"}]	2025-06-03 07:21:52.533	2025-07-25 07:50:28.968
10	11	[1]	[{"shopifyLineItemId":"16626680430923","suffix":1,"title":"Innato Bm3"}]	2025-05-13 14:49:22.026	2025-07-04 15:02:46.273
360	365	[1]	[{"shopifyLineItemId":"16724780450123","suffix":1,"title":"Innato Cm4"}]	2025-05-30 05:39:11.009	2025-07-25 07:50:29.303
342	347	[1]	[{"shopifyLineItemId":"16479462719819","suffix":1,"title":"Innato Bm3"}]	2025-05-13 14:57:03.091	2025-05-17 07:45:08.426
361	366	[1]	[{"shopifyLineItemId":"16723463799115","suffix":1,"title":"Innato D#m4"}]	2025-05-30 05:39:11.399	2025-07-25 07:50:29.725
362	367	[1]	[{"shopifyLineItemId":"16723416383819","suffix":1,"title":"Innato Dm4"}]	2025-05-30 05:39:11.779	2025-07-25 07:50:30.149
363	368	[1]	[{"shopifyLineItemId":"16721416552779","suffix":1,"title":"Natey Cm4"}]	2025-05-30 05:39:12.157	2025-07-15 11:15:13.754
359	364	[1,2]	[{"shopifyLineItemId":"16711286489419","suffix":1,"title":"Natey C#m4"},{"shopifyLineItemId":"16711286522187","suffix":2,"title":"Natey G#m4"}]	2025-05-26 06:49:04.911	2025-07-15 11:15:14.195
346	351	[1]	[{"shopifyLineItemId":"16451904012619","suffix":1,"title":"Natey Gm3"}]	2025-05-13 14:57:03.97	2025-05-17 07:45:08.998
347	352	[1]	[{"shopifyLineItemId":"16396443451723","suffix":1,"title":"Innato Am3"}]	2025-05-13 14:57:04.219	2025-05-17 07:45:09.196
341	346	[1]	[{"shopifyLineItemId":"16483464118603","suffix":1,"title":"Innato Cm4"}]	2025-05-13 14:57:02.924	2025-07-25 07:50:42.81
345	350	[1]	[{"shopifyLineItemId":"16465822089547","suffix":1,"title":"Innato Am3"}]	2025-05-13 14:57:03.768	2025-07-04 15:02:55.612
357	362	[1]	[{"shopifyLineItemId":"16707772252491","suffix":1,"title":"Innato Em4"}]	2025-05-25 10:30:41.61	2025-07-15 11:15:14.67
358	363	[1,2]	[{"shopifyLineItemId":"16707676078411","suffix":1,"title":"Innato Exploration Cards"},{"shopifyLineItemId":"16707676111179","suffix":2,"title":"ZEN flute Large"}]	2025-05-25 10:30:42.094	2025-07-15 11:15:15.099
356	361	[1]	[{"shopifyLineItemId":"16705063846219","suffix":1,"title":"Natey F#m4"}]	2025-05-24 14:29:45.098	2025-07-11 07:17:07.716
348	353	[1]	[{"shopifyLineItemId":"16391832273227","suffix":1,"title":"Innato Em3 (NEW)"}]	2025-05-13 14:57:04.402	2025-06-08 07:58:51.785
349	354	[1]	[{"shopifyLineItemId":"16317989617995","suffix":1,"title":"Innato Am3"}]	2025-05-13 14:57:04.797	2025-06-08 07:58:52.556
355	360	[1]	[{"shopifyLineItemId":"16703125946699","suffix":1,"title":"Innato Am3"}]	2025-05-24 04:03:01.644	2025-07-15 11:15:15.775
351	356	[1]	[{"shopifyLineItemId":"16260633428299","suffix":1,"title":"Double Large Native Am3"}]	2025-05-13 14:57:05.403	2025-07-11 18:32:50.753
343	348	[1,2,3,4]	[{"shopifyLineItemId":"16479417991499","suffix":1,"title":"Innato Am3"},{"shopifyLineItemId":"16479418024267","suffix":2,"title":"Innato Am3"},{"shopifyLineItemId":"16479418057035","suffix":3,"title":"Innato Em3 (NEW)"},{"shopifyLineItemId":"16479418089803","suffix":4,"title":"Innato G#m3"}]	2025-05-13 14:57:03.345	2025-07-10 08:33:00.834
344	349	[1,2,3,4]	[{"shopifyLineItemId":"16479365464395","suffix":1,"title":"Innato Am3"},{"shopifyLineItemId":"16479365497163","suffix":2,"title":"Innato Am3"},{"shopifyLineItemId":"16479365529931","suffix":3,"title":"Innato Em3 (NEW)"},{"shopifyLineItemId":"16479365562699","suffix":4,"title":"Innato G#m3"}]	2025-05-13 14:57:03.6	2025-07-10 08:33:01.297
8	9	[1,2,3,4,5,6,7,8,9,10,11,12]	[{"shopifyLineItemId":"16637598400843","suffix":1,"title":"Innato Am3"},{"shopifyLineItemId":"16637598433611","suffix":2,"title":"Innato Am3"},{"shopifyLineItemId":"16637598466379","suffix":3,"title":"Innato Bbm3"},{"shopifyLineItemId":"16637598499147","suffix":4,"title":"Innato Bbm3"},{"shopifyLineItemId":"16637598531915","suffix":5,"title":"Innato Bm3"},{"shopifyLineItemId":"16637598564683","suffix":6,"title":"Innato Bm3"},{"shopifyLineItemId":"16637598597451","suffix":7,"title":"Innato Bm3"},{"shopifyLineItemId":"16637598630219","suffix":8,"title":"Innato Cm4"},{"shopifyLineItemId":"16637598662987","suffix":9,"title":"Innato Cm4"},{"shopifyLineItemId":"16637598695755","suffix":10,"title":"Innato Cm4"},{"shopifyLineItemId":"16637598728523","suffix":11,"title":"Innato Dm4"},{"shopifyLineItemId":"16637598761291","suffix":12,"title":"Innato Em4"}]	2025-05-13 14:49:21.681	2025-06-08 07:58:38.819
385	390	[1]	[{"shopifyLineItemId":"16858190774603","suffix":1,"title":"Natey Gm3"}]	2025-06-29 05:52:04.378	2025-07-25 07:54:11.958
353	358	[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23]	[{"shopifyLineItemId":"16691001557323","suffix":1,"title":"Innato Am3"},{"shopifyLineItemId":"16691001590091","suffix":2,"title":"Innato Am3"},{"shopifyLineItemId":"16691001622859","suffix":3,"title":"Innato Bm3"},{"shopifyLineItemId":"16691001655627","suffix":4,"title":"Innato Bm3"},{"shopifyLineItemId":"16691001688395","suffix":5,"title":"Innato Cm4"},{"shopifyLineItemId":"16691001721163","suffix":6,"title":"Innato Cm4"},{"shopifyLineItemId":"16691001753931","suffix":7,"title":"Innato Dm4"},{"shopifyLineItemId":"16691001786699","suffix":8,"title":"Innato Dm4"},{"shopifyLineItemId":"16691001819467","suffix":9,"title":"Innato Gm3"},{"shopifyLineItemId":"16691001852235","suffix":10,"title":"Innato Gm3"},{"shopifyLineItemId":"16691001885003","suffix":11,"title":"Natey Bbm3"},{"shopifyLineItemId":"16691001917771","suffix":12,"title":"Natey Bbm3"},{"shopifyLineItemId":"16691001950539","suffix":13,"title":"Natey Em3"},{"shopifyLineItemId":"16691001983307","suffix":14,"title":"Natey Em3"},{"shopifyLineItemId":"16691002016075","suffix":15,"title":"Natey Fm4"},{"shopifyLineItemId":"16691002048843","suffix":16,"title":"Natey Fm4"},{"shopifyLineItemId":"16691002081611","suffix":17,"title":"Natey Gm3"},{"shopifyLineItemId":"16691002114379","suffix":18,"title":"Natey Gm3"},{"shopifyLineItemId":"16694322594123","suffix":19,"title":"Double Large Native Am3"},{"shopifyLineItemId":"16694322626891","suffix":20,"title":"Double Medium Native Cm4"},{"shopifyLineItemId":"16694322659659","suffix":21,"title":"Double Large Native Gm3"},{"shopifyLineItemId":"16694322659659","suffix":22,"title":"Double Large Native Gm3"},{"shopifyLineItemId":"16920727454027","suffix":23,"title":"Double Large Native Gm3"}]	2025-05-21 07:08:04.729	2025-07-15 12:06:29.957
373	378	[1]	[{"shopifyLineItemId":"16807369670987","suffix":1,"title":"Innato Bbm3"}]	2025-06-16 11:24:20.72	2025-07-25 07:50:25.565
372	377	[1]	[{"shopifyLineItemId":"16803239461195","suffix":1,"title":"Natey G#m4"}]	2025-06-16 07:17:28.862	2025-07-25 07:50:26.035
391	396	[1]	[{"shopifyLineItemId":"16880193405259","suffix":1,"title":"Innato Dm4"}]	2025-07-04 08:03:56.127	2025-07-25 07:54:11.068
388	393	[1]	[{"shopifyLineItemId":"16874946036043","suffix":1,"title":"ZEN flute Large"}]	2025-07-02 19:46:13.974	2025-07-25 07:54:11.269
374	379	[1]	[{"shopifyLineItemId":"16825813991755","suffix":1,"title":"Natey Em4"}]	2025-06-21 05:40:04.314	2025-07-10 08:32:39.805
389	394	[1]	[{"shopifyLineItemId":"16874423025995","suffix":1,"title":"ZEN flute Medium"}]	2025-07-02 19:46:14.361	2025-07-25 07:54:11.411
390	395	[1]	[{"shopifyLineItemId":"16879116616011","suffix":1,"title":"Natey Am3"}]	2025-07-03 17:54:39.539	2025-07-04 11:47:26.773
387	392	[1]	[{"shopifyLineItemId":"16868692328779","suffix":1,"title":"Double Medium Native Cm4"}]	2025-07-01 17:54:25.222	2025-07-25 07:54:11.557
386	391	[1]	[{"shopifyLineItemId":"16863753634123","suffix":1,"title":"Innato Am3"}]	2025-06-30 12:11:02.824	2025-07-25 07:54:11.661
384	389	[1]	[{"shopifyLineItemId":"16859124859211","suffix":1,"title":"Innato Bm3"}]	2025-06-29 05:52:03.972	2025-07-25 07:54:11.807
395	400	[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]	[{"shopifyLineItemId":"16926388191563","suffix":1,"title":"Natey Am4"},{"shopifyLineItemId":"16926388224331","suffix":2,"title":"Natey Am4"},{"shopifyLineItemId":"16926388257099","suffix":3,"title":"Natey Am4"},{"shopifyLineItemId":"16926388289867","suffix":4,"title":"Natey Bm3"},{"shopifyLineItemId":"16926388322635","suffix":5,"title":"Natey Bm3"},{"shopifyLineItemId":"16926388355403","suffix":6,"title":"Natey Cm4"},{"shopifyLineItemId":"16926388388171","suffix":7,"title":"Natey Cm4"},{"shopifyLineItemId":"16926388420939","suffix":8,"title":"Natey Cm4"},{"shopifyLineItemId":"16926388453707","suffix":9,"title":"Natey Dm4"},{"shopifyLineItemId":"16926388486475","suffix":10,"title":"Natey Dm4"},{"shopifyLineItemId":"16926388519243","suffix":11,"title":"Natey F#m4"},{"shopifyLineItemId":"16926388552011","suffix":12,"title":"Natey Fm4"},{"shopifyLineItemId":"16926388584779","suffix":13,"title":"Natey Fm4"},{"shopifyLineItemId":"16926388617547","suffix":14,"title":"Natey Gm4"},{"shopifyLineItemId":"16926388650315","suffix":15,"title":"Natey Gm4"},{"shopifyLineItemId":"16926388683083","suffix":16,"title":"Natey Gm4"}]	2025-07-16 09:32:45.435	2025-07-25 07:54:10.24
394	399	[1]	[{"shopifyLineItemId":"16924583297355","suffix":1,"title":"Natey Am4"}]	2025-07-16 06:05:34.491	2025-07-25 07:54:10.639
392	397	[1]	[{"shopifyLineItemId":"16887815668043","suffix":1,"title":"Natey Am4"}]	2025-07-06 09:14:14.603	2025-07-25 07:54:10.926
366	371	[1]	[{"shopifyLineItemId":"16757432910155","suffix":1,"title":"Double Large Native Gm3"}]	2025-06-05 12:44:57.476	2025-07-25 07:50:28.205
367	372	[1]	[{"shopifyLineItemId":"16769546846539","suffix":1,"title":"Innato C#m4"}]	2025-06-07 19:04:08.088	2025-07-25 07:50:27.85
\.


--
-- Data for Name: timesheets; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.timesheets (id, employee_name, work_date, start_time, end_time, total_time_minutes, break_time_minutes, worked_time_minutes, hourly_rate, total_amount, is_paid, paid_date, notes, created_at, updated_at) FROM stdin;
56	Hans	2025-06-18 09:02:40.498	2025-06-18 09:02:40.498	2025-06-18 09:02:49.571	0	0	\N	0	\N	f	\N	\N	2025-06-18 09:02:40.517385	2025-06-18 09:02:49.571
55	Mariena	2025-06-11 15:52:18.711	2025-06-11 15:52:18.711	\N	\N	0	\N	1500	\N	f	\N	\N	2025-06-11 15:52:18.720231	2025-06-11 15:52:18.720231
54	Tara	2025-06-11 15:52:17.148	2025-06-11 15:52:27.867	\N	0	0	\N	1500	\N	f	\N	\N	2025-06-11 15:52:17.156913	2025-06-11 15:52:27.867
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.users (id, username, password, current_challenge, device_id, remember_token, last_login) FROM stdin;
4	admin	f70e306611618be59f3bddcf67191c3e171d4c4ac13cff4278f092699f9c21cb	\N	\N	\N	\N
\.


--
-- Name: instrument_inventory_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.instrument_inventory_id_seq', 1, true);


--
-- Name: material_mapping_rules_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.material_mapping_rules_id_seq', 1, false);


--
-- Name: materials_inventory_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.materials_inventory_id_seq', 2, true);


--
-- Name: mold_inventory_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.mold_inventory_id_seq', 58, true);


--
-- Name: mold_mapping_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.mold_mapping_items_id_seq', 138, true);


--
-- Name: mold_mappings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.mold_mappings_id_seq', 78, true);


--
-- Name: order_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.order_items_id_seq', 4408, true);


--
-- Name: orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.orders_id_seq', 403, true);


--
-- Name: production_notes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.production_notes_id_seq', 1, true);


--
-- Name: resellers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.resellers_id_seq', 30, true);


--
-- Name: shopify_item_tracking_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.shopify_item_tracking_id_seq', 398, true);


--
-- Name: timesheets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.timesheets_id_seq', 56, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.users_id_seq', 6, true);


--
-- Name: instrument_inventory instrument_inventory_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.instrument_inventory
    ADD CONSTRAINT instrument_inventory_pkey PRIMARY KEY (id);


--
-- Name: instrument_inventory instrument_inventory_serial_number_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.instrument_inventory
    ADD CONSTRAINT instrument_inventory_serial_number_key UNIQUE (serial_number);


--
-- Name: instrument_inventory instrument_inventory_serial_number_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.instrument_inventory
    ADD CONSTRAINT instrument_inventory_serial_number_unique UNIQUE (serial_number);


--
-- Name: material_mapping_rules material_mapping_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.material_mapping_rules
    ADD CONSTRAINT material_mapping_rules_pkey PRIMARY KEY (id);


--
-- Name: materials_inventory materials_inventory_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.materials_inventory
    ADD CONSTRAINT materials_inventory_pkey PRIMARY KEY (id);


--
-- Name: mold_inventory mold_inventory_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.mold_inventory
    ADD CONSTRAINT mold_inventory_pkey PRIMARY KEY (id);


--
-- Name: mold_mapping_items mold_mapping_items_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.mold_mapping_items
    ADD CONSTRAINT mold_mapping_items_pkey PRIMARY KEY (id);


--
-- Name: mold_mappings mold_mappings_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.mold_mappings
    ADD CONSTRAINT mold_mappings_pkey PRIMARY KEY (id);


--
-- Name: mold_mappings mold_mappings_unique_type_tuning; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.mold_mappings
    ADD CONSTRAINT mold_mappings_unique_type_tuning UNIQUE (instrument_type, tuning_note);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_serial_number_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_serial_number_key UNIQUE (serial_number);


--
-- Name: order_items order_items_serial_number_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_serial_number_unique UNIQUE (serial_number);


--
-- Name: orders orders_order_number_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_order_number_key UNIQUE (order_number);


--
-- Name: orders orders_order_number_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_order_number_unique UNIQUE (order_number);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: orders orders_unique_order_number; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_unique_order_number UNIQUE (order_number);


--
-- Name: production_notes production_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.production_notes
    ADD CONSTRAINT production_notes_pkey PRIMARY KEY (id);


--
-- Name: resellers resellers_nickname_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.resellers
    ADD CONSTRAINT resellers_nickname_key UNIQUE (nickname);


--
-- Name: resellers resellers_nickname_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.resellers
    ADD CONSTRAINT resellers_nickname_unique UNIQUE (nickname);


--
-- Name: resellers resellers_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.resellers
    ADD CONSTRAINT resellers_pkey PRIMARY KEY (id);


--
-- Name: session session_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (sid);


--
-- Name: shopify_item_tracking shopify_item_tracking_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.shopify_item_tracking
    ADD CONSTRAINT shopify_item_tracking_pkey PRIMARY KEY (id);


--
-- Name: timesheets timesheets_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.timesheets
    ADD CONSTRAINT timesheets_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: users users_username_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_unique UNIQUE (username);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "IDX_session_expire" ON public.session USING btree (expire);


--
-- Name: idx_order_items_shopify_line_item_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_order_items_shopify_line_item_id ON public.order_items USING btree (shopify_line_item_id);


--
-- Name: mold_mapping_items mold_mapping_items_mapping_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.mold_mapping_items
    ADD CONSTRAINT mold_mapping_items_mapping_id_fkey FOREIGN KEY (mapping_id) REFERENCES public.mold_mappings(id) ON DELETE CASCADE;


--
-- Name: mold_mapping_items mold_mapping_items_mold_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.mold_mapping_items
    ADD CONSTRAINT mold_mapping_items_mold_id_fkey FOREIGN KEY (mold_id) REFERENCES public.mold_inventory(id) ON DELETE CASCADE;


--
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: production_notes production_notes_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.production_notes
    ADD CONSTRAINT production_notes_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.order_items(id) ON DELETE SET NULL;


--
-- Name: production_notes production_notes_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.production_notes
    ADD CONSTRAINT production_notes_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: shopify_item_tracking shopify_item_tracking_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.shopify_item_tracking
    ADD CONSTRAINT shopify_item_tracking_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

