--
-- PostgreSQL database dump
--

-- Dumped from database version 16.8
-- Dumped by pg_dump version 16.5

-- Started on 2025-05-15 07:20:16 UTC

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
-- TOC entry 216 (class 1259 OID 16473)
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
-- TOC entry 215 (class 1259 OID 16472)
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
-- TOC entry 3528 (class 0 OID 0)
-- Dependencies: 215
-- Name: instrument_inventory_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.instrument_inventory_id_seq OWNED BY public.instrument_inventory.id;


--
-- TOC entry 218 (class 1259 OID 16487)
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
-- TOC entry 217 (class 1259 OID 16486)
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
-- TOC entry 3529 (class 0 OID 0)
-- Dependencies: 217
-- Name: material_mapping_rules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.material_mapping_rules_id_seq OWNED BY public.material_mapping_rules.id;


--
-- TOC entry 220 (class 1259 OID 16500)
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
-- TOC entry 219 (class 1259 OID 16499)
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
-- TOC entry 3530 (class 0 OID 0)
-- Dependencies: 219
-- Name: materials_inventory_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.materials_inventory_id_seq OWNED BY public.materials_inventory.id;


--
-- TOC entry 222 (class 1259 OID 16514)
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
-- TOC entry 221 (class 1259 OID 16513)
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
-- TOC entry 3531 (class 0 OID 0)
-- Dependencies: 221
-- Name: mold_inventory_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.mold_inventory_id_seq OWNED BY public.mold_inventory.id;


--
-- TOC entry 224 (class 1259 OID 16527)
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
-- TOC entry 223 (class 1259 OID 16526)
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
-- TOC entry 3532 (class 0 OID 0)
-- Dependencies: 223
-- Name: mold_mapping_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.mold_mapping_items_id_seq OWNED BY public.mold_mapping_items.id;


--
-- TOC entry 226 (class 1259 OID 16536)
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
-- TOC entry 225 (class 1259 OID 16535)
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
-- TOC entry 3533 (class 0 OID 0)
-- Dependencies: 225
-- Name: mold_mappings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.mold_mappings_id_seq OWNED BY public.mold_mappings.id;


--
-- TOC entry 228 (class 1259 OID 16548)
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
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.order_items OWNER TO neondb_owner;

--
-- TOC entry 3534 (class 0 OID 0)
-- Dependencies: 228
-- Name: COLUMN order_items.shopify_line_item_id; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.order_items.shopify_line_item_id IS 'Unieke Shopify line item ID voor permanente koppeling met serienummers';


--
-- TOC entry 227 (class 1259 OID 16547)
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
-- TOC entry 3535 (class 0 OID 0)
-- Dependencies: 227
-- Name: order_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.order_items_id_seq OWNED BY public.order_items.id;


--
-- TOC entry 230 (class 1259 OID 16565)
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
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.orders OWNER TO neondb_owner;

--
-- TOC entry 229 (class 1259 OID 16564)
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
-- TOC entry 3536 (class 0 OID 0)
-- Dependencies: 229
-- Name: orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.orders_id_seq OWNED BY public.orders.id;


--
-- TOC entry 232 (class 1259 OID 16584)
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
-- TOC entry 231 (class 1259 OID 16583)
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
-- TOC entry 3537 (class 0 OID 0)
-- Dependencies: 231
-- Name: production_notes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.production_notes_id_seq OWNED BY public.production_notes.id;


--
-- TOC entry 234 (class 1259 OID 16595)
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
-- TOC entry 233 (class 1259 OID 16594)
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
-- TOC entry 3538 (class 0 OID 0)
-- Dependencies: 233
-- Name: resellers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.resellers_id_seq OWNED BY public.resellers.id;


--
-- TOC entry 239 (class 1259 OID 32768)
-- Name: session; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.session (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp(6) without time zone NOT NULL
);


ALTER TABLE public.session OWNER TO neondb_owner;

--
-- TOC entry 236 (class 1259 OID 16611)
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
-- TOC entry 235 (class 1259 OID 16610)
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
-- TOC entry 3539 (class 0 OID 0)
-- Dependencies: 235
-- Name: shopify_item_tracking_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.shopify_item_tracking_id_seq OWNED BY public.shopify_item_tracking.id;


--
-- TOC entry 238 (class 1259 OID 16624)
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
-- TOC entry 237 (class 1259 OID 16623)
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
-- TOC entry 3540 (class 0 OID 0)
-- Dependencies: 237
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 3239 (class 2604 OID 40960)
-- Name: instrument_inventory id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.instrument_inventory ALTER COLUMN id SET DEFAULT nextval('public.instrument_inventory_id_seq'::regclass);


--
-- TOC entry 3243 (class 2604 OID 40961)
-- Name: material_mapping_rules id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.material_mapping_rules ALTER COLUMN id SET DEFAULT nextval('public.material_mapping_rules_id_seq'::regclass);


--
-- TOC entry 3248 (class 2604 OID 40962)
-- Name: materials_inventory id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.materials_inventory ALTER COLUMN id SET DEFAULT nextval('public.materials_inventory_id_seq'::regclass);


--
-- TOC entry 3254 (class 2604 OID 40963)
-- Name: mold_inventory id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.mold_inventory ALTER COLUMN id SET DEFAULT nextval('public.mold_inventory_id_seq'::regclass);


--
-- TOC entry 3259 (class 2604 OID 40964)
-- Name: mold_mapping_items id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.mold_mapping_items ALTER COLUMN id SET DEFAULT nextval('public.mold_mapping_items_id_seq'::regclass);


--
-- TOC entry 3262 (class 2604 OID 40965)
-- Name: mold_mappings id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.mold_mappings ALTER COLUMN id SET DEFAULT nextval('public.mold_mappings_id_seq'::regclass);


--
-- TOC entry 3266 (class 2604 OID 40966)
-- Name: order_items id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.order_items ALTER COLUMN id SET DEFAULT nextval('public.order_items_id_seq'::regclass);


--
-- TOC entry 3273 (class 2604 OID 40967)
-- Name: orders id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);


--
-- TOC entry 3282 (class 2604 OID 40968)
-- Name: production_notes id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.production_notes ALTER COLUMN id SET DEFAULT nextval('public.production_notes_id_seq'::regclass);


--
-- TOC entry 3285 (class 2604 OID 40969)
-- Name: resellers id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.resellers ALTER COLUMN id SET DEFAULT nextval('public.resellers_id_seq'::regclass);


--
-- TOC entry 3291 (class 2604 OID 40970)
-- Name: shopify_item_tracking id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.shopify_item_tracking ALTER COLUMN id SET DEFAULT nextval('public.shopify_item_tracking_id_seq'::regclass);


--
-- TOC entry 3296 (class 2604 OID 40971)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 3499 (class 0 OID 16473)
-- Dependencies: 216
-- Data for Name: instrument_inventory; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.instrument_inventory (id, serial_number, instrument_type, tuning_type, color, date_produced, status, location, craftsperson, notes, price, created_at, updated_at) FROM stdin;
1	SW-I5001	INNATO_F3	B	terra	2025-04-01 00:00:00	available	showroom	Marco	Testmodel voor het systeem	149995	2025-04-01 12:34:56	2025-04-01 12:34:56
\.


--
-- TOC entry 3501 (class 0 OID 16487)
-- Dependencies: 218
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
-- TOC entry 3503 (class 0 OID 16500)
-- Dependencies: 220
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
-- TOC entry 3505 (class 0 OID 16514)
-- Dependencies: 222
-- Data for Name: mold_inventory; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.mold_inventory (id, name, size, instrument_type, is_active, notes, last_used, created_at, updated_at) FROM stdin;
55	OvA		OvA	t		\N	2025-05-15 05:23:14.018915	2025-05-15 05:23:14.018915
56	17 21,5 25		INNATO	t		\N	2025-05-15 05:28:35.50905	2025-05-15 05:28:35.50905
28	12 17 19		INNATO	t		\N	2025-05-15 05:15:58.022757	2025-05-15 05:15:58.022757
29	13 18 20,5		INNATO	t		\N	2025-05-15 05:16:25.442315	2025-05-15 05:16:25.442315
30	14 19 22		INNATO	t		\N	2025-05-15 05:16:39.876249	2025-05-15 05:16:39.876249
31	15 19 23 SM		INNATO	t		\N	2025-05-15 05:17:11.93592	2025-05-15 05:17:11.93592
32	16 20,5 24		INNATO	t		\N	2025-05-15 05:18:17.745123	2025-05-15 05:18:17.745123
33	17 22 26		INNATO	t		\N	2025-05-15 05:18:30.488605	2025-05-15 05:18:30.488605
34	18 24 28		INNATO	t		\N	2025-05-15 05:18:39.348607	2025-05-15 05:18:39.348607
35	19 26 30		INNATO	t		\N	2025-05-15 05:18:50.260291	2025-05-15 05:18:50.260291
36	19 26 30		INNATO	t		\N	2025-05-15 05:18:58.365291	2025-05-15 05:18:58.365291
37	20,5 28, 32		INNATO	t		\N	2025-05-15 05:19:07.623075	2025-05-15 05:19:07.623075
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
-- TOC entry 3507 (class 0 OID 16527)
-- Dependencies: 224
-- Data for Name: mold_mapping_items; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.mold_mapping_items (id, mapping_id, mold_id, order_index, created_at) FROM stdin;
81	60	41	0	2025-05-15 05:32:26.465278
82	61	42	0	2025-05-15 05:32:39.673272
83	62	43	0	2025-05-15 05:32:50.604775
85	63	43	0	2025-05-15 05:33:04.582777
86	64	44	0	2025-05-15 05:33:15.454187
87	65	45	0	2025-05-15 05:33:25.188476
90	66	45	0	2025-05-15 05:33:44.45193
91	67	46	0	2025-05-15 05:33:57.998668
92	68	47	0	2025-05-15 05:34:07.821657
93	69	51	0	2025-05-15 05:34:54.580089
94	70	52	0	2025-05-15 05:35:00.14155
95	71	53	0	2025-05-15 05:35:56.908399
99	72	53	0	2025-05-15 05:36:24.660081
101	73	53	0	2025-05-15 05:36:39.76461
102	74	54	0	2025-05-15 05:36:52.997771
104	75	54	0	2025-05-15 05:37:09.903126
106	76	54	0	2025-05-15 05:37:30.378645
109	77	55	0	2025-05-15 05:38:05.084768
55	41	28	0	2025-05-15 05:25:29.405676
56	42	29	0	2025-05-15 05:25:50.032378
58	43	29	0	2025-05-15 05:26:11.543018
59	44	30	0	2025-05-15 05:26:28.148914
60	45	31	0	2025-05-15 05:27:03.537255
61	46	32	0	2025-05-15 05:27:18.835149
63	47	56	0	2025-05-15 05:28:43.101942
64	48	33	0	2025-05-15 05:28:59.024686
65	49	34	0	2025-05-15 05:29:08.28304
67	50	34	0	2025-05-15 05:29:33.465468
68	51	36	0	2025-05-15 05:29:53.91652
70	52	36	0	2025-05-15 05:30:13.243478
72	54	38	0	2025-05-15 05:30:33.056488
74	55	38	0	2025-05-15 05:30:55.47463
75	56	39	0	2025-05-15 05:31:06.951905
76	57	40	0	2025-05-15 05:31:17.31089
78	58	40	0	2025-05-15 05:31:29.010286
79	53	41	0	2025-05-15 05:31:43.850438
\.


--
-- TOC entry 3509 (class 0 OID 16536)
-- Dependencies: 226
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
-- TOC entry 3511 (class 0 OID 16548)
-- Dependencies: 228
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.order_items (id, order_id, serial_number, item_type, item_size, tuning_type, color, weight, craftsperson, order_number, order_date, deadline, build_date, bag_size, box_size, shopify_line_item_id, specifications, status, progress, status_change_dates, is_archived, archived_reason, created_at, updated_at) FROM stdin;
4288	338	1572-1	Natey Cm4	\N	\N	\N	\N	\N	\N	\N	\N	2025-05-13 18:08:04.876	\N	\N	16496935403851	{"type":"Natey Cm4","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"Cm4","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-05-13T15:24:38.952Z","validated":"2025-05-13T18:08:03.477Z","dry":"2025-05-13T18:08:04.175Z","building":"2025-05-13T18:08:04.876Z","testing":"2025-05-14T12:42:02.539Z","firing":"2025-05-14T12:42:03.360Z"}	f	\N	2025-05-13 14:57:01.538812	2025-05-15 07:13:52.35
4276	327	1584-1	ZEN flute Medium	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16569193529675	{"type":"ZEN flute Medium","model":"ZEN","fluteType":"ZEN","tuningFrequency":"440Hz","frequency":"440","tuning":"M","color":"Smokefired Terra and Black","fulfillable_quantity":"1"}	ordered	0	{}	f	\N	2025-05-13 14:56:59.844013	2025-05-15 07:13:50.363
4287	337	1573-1	Innato Em4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"type":"Innato Em4","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Em4","color":"Smokefired Terra and Black","key":"440 Hz","fulfillable_quantity":"0"}	ordered	0	{"ordered":"2025-05-13T15:24:38.952Z"}	t	Automatisch gearchiveerd omdat het item al is fulfilled in Shopify	2025-05-13 14:57:01.384311	2025-05-13 14:57:01.384311
4289	339	1571-1	Innato Dm4	\N	\N	\N	\N	\N	\N	\N	\N	2025-05-13 18:08:02.659	\N	\N	16494827569483	{"type":"Innato Dm4","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Dm4","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-05-13T15:24:38.952Z","validated":"2025-05-13T18:08:01.187Z","dry":"2025-05-13T18:08:01.925Z","building":"2025-05-13T18:08:02.659Z","testing":"2025-05-14T12:42:00.880Z","firing":"2025-05-14T12:42:01.806Z"}	f	\N	2025-05-13 14:57:01.713752	2025-05-15 07:13:52.526
4283	333	1577-1	Innato Em4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16538871071051	{"type":"Innato Em4","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Em4","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{}	f	\N	2025-05-13 14:57:00.787884	2025-05-15 07:13:51.522
4285	335	1575-1	Natey Dm4	\N	\N	\N	\N	\N	\N	\N	\N	2025-05-13 18:08:18.274	\N	\N	16535593353547	{"type":"Natey Dm4","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"Dm4","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-05-13T18:08:16.859Z","dry":"2025-05-13T18:08:17.709Z","building":"2025-05-13T18:08:18.274Z","validated":"2025-05-13T18:08:18.908Z","testing":"2025-05-14T12:42:05.294Z","firing":"2025-05-14T12:42:08.345Z"}	f	\N	2025-05-13 14:57:01.091733	2025-05-15 07:13:51.868
4286	336	1574-1	Innato Bm3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16509335044427	{"type":"Innato Bm3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Bm3","color":"Blue, with Terra and Gold Bubbles","key":"432 Hz","fulfillable_quantity":"1"}	ordered	0	{}	f	\N	2025-05-13 14:57:01.240009	2025-05-15 07:13:52.004
2	3	1600-1	Natey Am4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"type":"Natey Am4","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"Am4","color":"Blue, with Terra and Gold Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{}	f	\N	2025-05-13 14:49:20.169517	2025-05-15 07:13:47.511
23	13	1590-1	Innato Em4	\N	\N	\N	\N	\N	\N	\N	\N	2025-05-13 18:08:43.042	\N	\N	\N	{"type":"Innato Em4","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Em4","color":"Blue, with Terra and Gold Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	quality_check	0	{"terrasigillata":"2025-05-25T15:24:38.952Z","smokefiring":"2025-05-31T15:24:38.952Z","quality_check":"2025-06-09T15:24:38.952Z"}	f	\N	2025-05-13 14:49:22.367326	2025-05-15 07:13:49.499
26	16	1586-1	ZEN flute Medium	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"type":"ZEN flute Medium","model":"ZEN","fluteType":"ZEN","tuningFrequency":"440Hz","frequency":"440","tuning":"M","color":"Smokefired Terra and Black","fulfillable_quantity":"1"}	ordered	0	{}	f	\N	2025-05-13 14:49:22.933765	2025-05-15 07:13:50.019
4292	342	1567-1	Natey Am4	\N	\N	\N	\N	\N	\N	\N	\N	2025-05-13 18:07:50.644	\N	\N	16489221980491	{"type":"Natey Am4","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"Am4","color":"Blue, with Terra and Gold Bubbles","key":"432 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-05-13T15:24:38.952Z","validated":"2025-05-13T18:07:49.043Z","dry":"2025-05-13T18:07:49.924Z","building":"2025-05-13T18:07:50.644Z","testing":"2025-05-14T12:41:57.619Z","firing":"2025-05-14T12:41:58.400Z"}	f	\N	2025-05-13 14:57:02.32261	2025-05-15 07:13:53.037
1	1	SW-I1001	INNATO_A3	\N	B	terra	\N	Marco	SW-2025-001	2025-05-01 00:00:00	2025-05-25 00:00:00	\N	L	31x31x31	gid://shopify/LineItem/12345678901	{"voicing": "standard", "vessel_color": "terra"}	archived	30	{"ordered":"2025-03-15T15:24:38.952Z","validated":"2025-03-18T15:24:38.952Z","building":"2025-03-21T15:24:38.952Z","testing":"2025-03-24T15:24:38.952Z","terrasigillata":"2025-03-27T15:24:38.952Z","firing":"2025-03-30T15:24:38.952Z","smokefiring":"2025-04-02T15:24:38.952Z","tuning1":"2025-04-05T15:24:38.952Z","tuning2":"2025-04-08T15:24:38.952Z","quality_check":"2025-04-11T15:24:38.952Z","ready":"2025-04-14T15:24:38.952Z","shipping":"2025-04-17T15:24:38.952Z","delivered":"2025-04-20T15:24:38.952Z","archived":"2025-04-23T15:24:38.952Z"}	t	Order automatisch gearchiveerd omdat deze niet meer actief is in Shopify	2025-05-01 00:00:00	2025-05-13 14:49:18.337
4290	340	1570-1	Innato Dm4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"type":"Innato Dm4","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Dm4","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"0"}	ordered	0	{"ordered":"2025-05-13T15:24:38.952Z"}	t	Automatisch gearchiveerd omdat het item al is fulfilled in Shopify	2025-05-13 14:57:01.88566	2025-05-13 14:57:01.88566
4294	344	1565-1	Natey G#m4	\N	\N	\N	\N	\N	\N	\N	\N	2025-05-13 18:07:37.883	\N	\N	16484188782923	{"type":"Natey G#m4","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"G#m4","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1","bagType":"Natey","bagSize":"S","Bag Type":"Natey","Bag Size":"S","bag type":"Natey","bag size":"S"}	ordered	0	{"ordered":"2025-05-13T15:24:38.952Z","validated":"2025-05-13T18:07:36.281Z","dry":"2025-05-13T18:07:37.092Z","building":"2025-05-13T18:07:37.883Z","testing":"2025-05-14T12:41:53.823Z","firing":"2025-05-14T12:41:54.805Z"}	f	\N	2025-05-13 14:57:02.614892	2025-05-15 07:13:53.383
4297	347	1561-1	Innato Bm3	\N	\N	\N	\N	\N	\N	\N	\N	2025-05-13 18:07:28.906	\N	\N	16479462719819	{"type":"Innato Bm3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Bm3","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-05-13T15:24:38.952Z","validated":"2025-05-13T18:07:27.160Z","dry":"2025-05-13T18:07:28.125Z","building":"2025-05-13T18:07:28.906Z","testing":"2025-05-14T12:41:44.028Z","firing":"2025-05-14T12:41:49.380Z"}	f	\N	2025-05-13 14:57:03.080574	2025-05-15 07:13:53.927
4300	348	1560-3	Innato Em3 (NEW)	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16479418057035	{"type":"Innato Em3 (NEW)","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Em3","color":"Blue, with Terra and Gold Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{}	f	\N	2025-05-13 14:57:03.299301	2025-05-15 07:13:54.106
28	2	1601-1	Natey F#m4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16667050344779	{"type":"Natey F#m4","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"F#m4","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1","bagType":"Natey","bagSize":"M","Bag Type":"Natey","Bag Size":"M","bag type":"Natey","bag size":"M"}	ordered	0	{}	f	\N	2025-05-13 14:49:24.07581	2025-05-15 07:13:47.316
4301	348	1560-4	Innato G#m3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16479418089803	{"type":"Innato G#m3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"G#m3","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{}	f	\N	2025-05-13 14:57:03.335562	2025-05-15 07:13:54.125
4	5	1598-1	Innato Gm3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"type":"Innato Gm3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Gm3","color":"Blue, with Terra and Gold Bubbles","key":"432 Hz","fulfillable_quantity":"1"}	ordered	0	{}	f	\N	2025-05-13 14:49:20.51061	2025-05-15 07:13:47.912
24	14	1589-1	Natey Dm4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"type":"Natey Dm4","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"Dm4","color":"Blue, with Terra and Gold Bubbles","key":"432 Hz","fulfillable_quantity":"1"}	ordered	0	{}	f	\N	2025-05-13 14:49:22.55223	2025-05-15 07:13:49.666
4296	346	1563-1	Innato Cm4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"type":"Innato Cm4","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Cm4","color":"Smokefired black with Terra and Copper Bubbles","key":"440 Hz","fulfillable_quantity":"0"}	ordered	0	{"ordered":"2025-05-13T15:24:38.952Z"}	t	Automatisch gearchiveerd omdat het item al is fulfilled in Shopify	2025-05-13 14:57:02.914065	2025-05-13 14:57:02.914065
4299	348	1560-2	Innato Am3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"type":"Innato Am3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Am3","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"0"}	ordered	0	{"ordered":"2025-05-13T15:24:38.952Z"}	t	Automatisch gearchiveerd omdat het item al is fulfilled in Shopify	2025-05-13 14:57:03.263108	2025-05-13 14:57:03.263108
25	15	1588-1	Natey G#m4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"type":"Natey G#m4","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"G#m4","color":"Smokefired Terra with Terra and bronze Bubbles","key":"432 Hz","fulfillable_quantity":"1"}	ordered	0	{}	f	\N	2025-05-13 14:49:22.728019	2025-05-15 07:13:49.833
4304	349	1559-3	Innato Em3 (NEW)	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"type":"Innato Em3 (NEW)","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Em3","color":"Blue, with Terra and Gold Bubbles","key":"440 Hz","fulfillable_quantity":"0"}	ordered	0	{"ordered":"2025-05-12T15:24:38.952Z"}	t	Automatisch gearchiveerd omdat het item al is fulfilled in Shopify	2025-05-13 14:57:03.554603	2025-05-13 14:57:03.554603
4305	349	1559-4	Innato G#m3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"type":"Innato G#m3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"G#m3","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"0"}	ordered	0	{"ordered":"2025-05-12T15:24:38.952Z"}	t	Automatisch gearchiveerd omdat het item al is fulfilled in Shopify	2025-05-13 14:57:03.589416	2025-05-13 14:57:03.589416
4298	348	1560-1	Innato Am3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"type":"Innato Am3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Am3","color":"Blue, with Terra and Gold Bubbles","key":"440 Hz","fulfillable_quantity":"0"}	ordered	0	{"ordered":"2025-05-13T15:24:38.952Z"}	t	Automatisch gearchiveerd omdat het item al is fulfilled in Shopify	2025-05-13 14:57:03.227639	2025-05-13 14:57:03.227639
10	9	1594-3	Innato Bbm3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"type":"Innato Bbm3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Bbm3","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{}	f	\N	2025-05-13 14:49:21.290852	2025-05-15 07:13:48.625
4279	330	1580-1	Innato Cm4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16563508445515	{"type":"Innato Cm4","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Cm4","color":"Blue, with Terra and Gold Bubbles","key":"432 Hz","fulfillable_quantity":"1"}	ordered	0	{}	f	\N	2025-05-13 14:57:00.308167	2025-05-15 07:13:50.964
4293	343	1566-1	Natey Am3	\N	\N	\N	\N	\N	\N	\N	\N	2025-05-13 18:07:41.394	\N	\N	16486560072011	{"type":"Natey Am3","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"Am3","color":"Smokefired Terra with Terra and bronze Bubbles","key":"432 Hz","fulfillable_quantity":"1","bagType":"Natey","bagSize":"L","Bag Type":"Natey","Bag Size":"L","bag type":"Natey","bag size":"L"}	ordered	0	{"ordered":"2025-05-13T15:24:38.952Z","validated":"2025-05-13T18:07:39.791Z","dry":"2025-05-13T18:07:40.775Z","building":"2025-05-13T18:07:41.394Z","testing":"2025-05-14T12:41:55.769Z","firing":"2025-05-14T12:41:56.862Z"}	f	\N	2025-05-13 14:57:02.469496	2025-05-15 07:13:53.212
4280	330	1580-2	Innato Fm3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16563508478283	{"type":"Innato Fm3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Fm3","color":"Smokefired black with Terra and Copper Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{}	f	\N	2025-05-13 14:57:00.344406	2025-05-15 07:13:50.99
4303	349	1559-2	Innato Am3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16479365497163	{"type":"Innato Am3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Am3","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1","boxSize":{"type":"standard","size":"35x35x35"},"Box Size":{"type":"standard","size":"35x35x35"},"box size":{"type":"standard","size":"35x35x35"}}	ordered	0	{}	f	\N	2025-05-13 14:57:03.517385	2025-05-15 07:13:54.286
4281	331	1579-1	Innato Bbm3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16560707633483	{"type":"Innato Bbm3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Bbm3","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{}	f	\N	2025-05-13 14:57:00.488478	2025-05-15 07:13:51.176
21	11	1592-1	Innato Bm3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"type":"Innato Bm3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Bm3","color":"Smokefired black with Terra and Copper Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	terrasigillata	0	{"terrasigillata":"2025-05-25T15:24:38.952Z"}	f	\N	2025-05-13 14:49:22.017782	2025-05-15 07:13:49.154
4277	328	1583-1	Innato Exploration Cards	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16568669241675	{"type":"Innato Exploration Cards","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","fulfillable_quantity":"1"}	ordered	0	{}	f	\N	2025-05-13 14:56:59.994741	2025-05-15 07:13:50.525
4309	353	1546-1	Innato Em3 (NEW)	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16391832273227	{"type":"Innato Em3 (NEW)","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Em3","color":"Blue, with Terra and Gold Bubbles","key":"432 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-05-15T06:15:33.189Z","validated":"2025-05-15T06:15:40.356Z"}	f	\N	2025-05-13 14:57:04.390596	2025-05-15 07:13:55.138
4295	345	1564-1	Innato Em4	\N	\N	\N	\N	\N	\N	\N	\N	2025-05-13 18:07:35.493	\N	\N	16483698901323	{"type":"Innato Em4","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Em4","color":"Blue, with Terra and Gold Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-05-13T15:24:38.952Z","validated":"2025-05-13T18:07:33.725Z","dry":"2025-05-13T18:07:34.641Z","building":"2025-05-13T18:07:35.493Z","testing":"2025-05-14T12:41:52.210Z","firing":"2025-05-14T12:41:52.969Z"}	f	\N	2025-05-13 14:57:02.762393	2025-05-15 07:13:53.548
4291	341	1568-1	Innato Cm4	\N	\N	\N	\N	\N	\N	\N	\N	2025-05-13 18:08:00.192	\N	\N	16492498616651	{"type":"Innato Cm4","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Cm4","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-05-13T15:24:38.952Z","validated":"2025-05-13T18:07:58.810Z","dry":"2025-05-13T18:07:59.588Z","building":"2025-05-13T18:08:00.192Z","testing":"2025-05-14T12:41:59.319Z","firing":"2025-05-14T12:42:00.169Z"}	f	\N	2025-05-13 14:57:02.162424	2025-05-15 07:13:52.867
4312	356	1518-1	Double Large Native Am3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"type":"Double Large Native Am3","model":"DOUBLE","fluteType":"DOUBLE","tuningFrequency":"440Hz","frequency":"440","tuning":"Am3","color":"Blue, with Terra and Gold Bubbles","key":"432 Hz","fulfillable_quantity":"0"}	ordered	0	{"ordered":"2025-04-01T15:24:38.952Z"}	t	Automatisch gearchiveerd omdat het item al is fulfilled in Shopify	2025-05-13 14:57:05.392544	2025-05-13 14:57:05.392544
9	9	1594-2	Innato Am3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"type":"Innato Am3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Am3","color":"Smokefired black with Terra and Copper Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{}	f	\N	2025-05-13 14:49:21.254026	2025-05-15 07:13:48.602
4310	354	1537-1	Innato Am3	\N	\N	\N		\N	\N	\N	\N	\N	\N	\N	16317989617995	{"type":"Innato Am3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Am3","color":"Blue, with Terra and Gold Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{"validated":"2025-05-15T06:09:44.354Z","ordered":"2025-05-15T06:09:46.072Z"}	f	\N	2025-05-13 14:57:04.783982	2025-05-15 07:13:55.475
4278	329	1582-1	Natey Gm3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16565900673355	{"type":"Natey Gm3","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"Gm3","color":"Blue, with Terra and Gold Bubbles","key":"440 Hz","fulfillable_quantity":"1","bagType":"Natey","bagSize":"L","Bag Type":"Natey","Bag Size":"L","bag type":"Natey","bag size":"L"}	ordered	0	{}	f	\N	2025-05-13 14:57:00.14217	2025-05-15 07:13:50.691
6	7	1596-1	Natey Cm4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"type":"Natey Cm4","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"Cm4","color":"Blue, with Terra and Gold Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{}	f	\N	2025-05-13 14:49:20.867109	2025-05-15 07:13:48.263
7	8	1595-1	Natey G#m4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"type":"Natey G#m4","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"G#m4","color":"Smokefired Terra with Terra and bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{}	f	\N	2025-05-13 14:49:21.056189	2025-05-15 07:13:48.44
8	9	1594-1	Innato Am3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"type":"Innato Am3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Am3","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{}	f	\N	2025-05-13 14:49:21.212571	2025-05-15 07:13:48.579
4313	357	1515-1	Double Medium Native Bbm3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"type":"Double Medium Native Bbm3","model":"DOUBLE","fluteType":"DOUBLE","tuningFrequency":"440Hz","frequency":"440","tuning":"Bbm3","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"0"}	ordered	0	{"ordered":"2025-03-29T15:24:38.952Z"}	t	Automatisch gearchiveerd omdat het item al is fulfilled in Shopify	2025-05-13 15:18:48.58601	2025-05-13 15:18:48.58601
3	4	1599-1	Natey Am4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"type":"Natey Am4","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"Am4","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ready	0	{"terrasigillata":"2025-05-25T15:24:38.952Z","smokefiring":"2025-05-31T15:24:38.952Z","quality_check":"2025-06-09T15:24:38.952Z","ready":"2025-06-12T15:24:38.952Z"}	f	\N	2025-05-13 14:49:20.345387	2025-05-15 07:13:47.715
5	6	1597-1	Innato Fm3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"type":"Innato Fm3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Fm3","color":"Smokefired Terra with Terra and bronze Bubbles","key":"432 Hz","fulfillable_quantity":"1"}	ordered	0	{}	f	\N	2025-05-13 14:49:20.684444	2025-05-15 07:13:48.093
11	9	1594-4	Innato Bbm3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"type":"Innato Bbm3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Bbm3","color":"Smokefired black with Terra and Copper Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{}	f	\N	2025-05-13 14:49:21.329991	2025-05-15 07:13:48.645
22	12	1591-1	ZEN flute Large	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"type":"ZEN flute Large","model":"ZEN","fluteType":"ZEN","tuningFrequency":"440Hz","frequency":"440","tuning":"L","color":"Blue, with Terra and Gold Bubbles","fulfillable_quantity":"1"}	tuning1	0	{"terrasigillata":"2025-05-25T15:24:38.952Z","smokefiring":"2025-05-31T15:24:38.952Z"}	f	\N	2025-05-13 14:49:22.176344	2025-05-15 07:13:49.32
4308	352	1548-1	Innato Am3	\N	\N	\N	\N	\N	\N	\N	\N	2025-05-13 18:03:50.591	\N	\N	16396443451723	{"type":"Innato Am3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Am3","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1","boxSize":"35x35x35","Box Size":"35x35x35","box size":"35x35x35"}	ordered	0	{"ordered":"2025-05-01T15:24:38.952Z","validated":"2025-05-13T18:03:49.244Z","dry":"2025-05-13T18:03:49.945Z","building":"2025-05-13T18:03:50.591Z","testing":"2025-05-14T12:41:40.190Z","firing":"2025-05-14T12:41:41.337Z"}	f	\N	2025-05-13 14:57:04.208334	2025-05-15 07:13:54.948
27	17	1585-1	Innato Dm4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16574528029003	{"type":"Innato Dm4","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Dm4","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{}	f	\N	2025-05-13 14:49:23.096317	2025-05-15 07:13:50.196
4282	332	1578-1	Innato C#m4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16550977012043	{"type":"Innato C#m4","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"C#m4","color":"Blue, with Terra and Gold Bubbles","key":"432 Hz","fulfillable_quantity":"1"}	ordered	0	{}	f	\N	2025-05-13 14:57:00.633426	2025-05-15 07:13:51.352
4284	334	1576-1	Natey Am4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16537558319435	{"type":"Natey Am4","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"Am4","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{}	f	\N	2025-05-13 14:57:00.938974	2025-05-15 07:13:51.698
4306	350	1557-1	Innato Am3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16465822089547	{"type":"Innato Am3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Am3","color":"Smokefired Terra with Terra and bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{"ordered":"2025-05-10T15:24:38.952Z"}	t	Order fulfilled in Shopify	2025-05-13 14:57:03.757847	2025-05-15 07:13:54.428
4307	351	1553-1	Natey Gm3	\N	\N	\N	\N	\N	\N	\N	\N	2025-05-13 18:06:53.71	\N	\N	16451904012619	{"type":"Natey Gm3","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"Gm3","color":"Smokefired Terra with Terra and bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1","bagType":"Natey","bagSize":"L","Bag Type":"Natey","Bag Size":"L","bag type":"Natey","bag size":"L","boxSize":"12x12x30","Box Size":"12x12x30","box size":"12x12x30"}	ordered	0	{"ordered":"2025-05-06T15:24:38.952Z","validated":"2025-05-13T18:03:58.142Z","dry":"2025-05-13T18:06:52.644Z","building":"2025-05-13T18:06:53.710Z","testing":"2025-05-14T12:41:42.256Z","firing":"2025-05-15T06:16:04.740Z"}	f	\N	2025-05-13 14:57:03.96043	2025-05-15 07:13:54.675
4311	355	1535-1	Innato Exploration Cards	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"type":"Innato Exploration Cards","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","fulfillable_quantity":"1"}	archived	0	{"ordered":"2025-04-18T15:24:38.952Z","validated":"2025-04-21T15:24:38.952Z","building":"2025-04-24T15:24:38.952Z","testing":"2025-04-27T15:24:38.952Z","terrasigillata":"2025-04-30T15:24:38.952Z","firing":"2025-05-03T15:24:38.952Z","smokefiring":"2025-05-06T15:24:38.952Z","tuning1":"2025-05-09T15:24:38.952Z","tuning2":"2025-05-12T15:24:38.952Z","quality_check":"2025-05-15T15:24:38.952Z","ready":"2025-05-18T15:24:38.952Z","shipping":"2025-05-21T15:24:38.952Z","delivered":"2025-05-24T15:24:38.952Z","archived":"2025-05-27T15:24:38.952Z"}	t	Order fulfilled in Shopify	2025-05-13 14:57:04.955903	2025-05-15 07:13:55.568
12	9	1594-5	Innato Bm3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"type":"Innato Bm3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Bm3","color":"Blue, with Terra and Gold Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{}	f	\N	2025-05-13 14:49:21.378593	2025-05-15 07:13:48.664
13	9	1594-6	Innato Bm3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"type":"Innato Bm3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Bm3","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{}	f	\N	2025-05-13 14:49:21.41942	2025-05-15 07:13:48.683
14	9	1594-7	Innato Bm3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"type":"Innato Bm3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Bm3","color":"Smokefired black with Terra and Copper Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{}	f	\N	2025-05-13 14:49:21.464577	2025-05-15 07:13:48.702
15	9	1594-8	Innato Cm4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"type":"Innato Cm4","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Cm4","color":"Blue, with Terra and Gold Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{}	f	\N	2025-05-13 14:49:21.504851	2025-05-15 07:13:48.721
16	9	1594-9	Innato Cm4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"type":"Innato Cm4","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Cm4","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{}	f	\N	2025-05-13 14:49:21.550996	2025-05-15 07:13:48.749
17	9	1594-10	Innato Cm4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"type":"Innato Cm4","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Cm4","color":"Smokefired Terra and Black","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{}	f	\N	2025-05-13 14:49:21.593013	2025-05-15 07:13:48.769
18	9	1594-11	Innato Dm4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"type":"Innato Dm4","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Dm4","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{}	f	\N	2025-05-13 14:49:21.633817	2025-05-15 07:13:48.791
19	9	1594-12	Innato Em4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"type":"Innato Em4","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Em4","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{}	f	\N	2025-05-13 14:49:21.672466	2025-05-15 07:13:48.813
20	10	1593-1	Innato Gm3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"type":"Innato Gm3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Gm3","color":"Smokefired Terra with Terra and bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	ordered	0	{}	f	\N	2025-05-13 14:49:21.84004	2025-05-15 07:13:48.985
4302	349	1559-1	Innato Am3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16479365464395	{"type":"Innato Am3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Am3","color":"Blue, with Terra and Gold Bubbles","key":"440 Hz","fulfillable_quantity":"1","boxSize":"35x35x35","Box Size":"35x35x35","box size":"35x35x35"}	ordered	0	{}	f	\N	2025-05-13 14:57:03.480637	2025-05-15 07:13:54.267
\.


--
-- TOC entry 3513 (class 0 OID 16565)
-- Dependencies: 230
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.orders (id, order_number, shopify_order_id, customer_name, customer_email, customer_phone, customer_address, customer_city, customer_state, customer_zip, customer_country, order_type, is_reseller, reseller_nickname, status, order_date, deadline, notes, progress, specifications, status_change_dates, build_date, archived, tracking_number, tracking_company, tracking_url, shipped_date, estimated_delivery_date, delivery_status, delivered_date, created_at, updated_at) FROM stdin;
9	SW-1594	6623199691083	Alan Tower	alan@theresonancecenter.com	\N	2045 Meridian Avenue, Apt A	South Pasadena	California	91030	United States	retail	t	ALAN	ordered	2025-05-04 20:19:07	\N		0	{"type":"Innato Am3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Am3","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-05-13 14:49:21.175979	2025-05-13 18:02:14.244
2	SW-1601	6638319632715	James Steinbrecher	jamesesteinbrecher818@yahoo.com	+19062826644	137 Mission Ridge Overlook	hayesville	North Carolina	28904	United States	retail	f	\N	ordered	2025-05-13 13:12:02	\N		0	{"type":"Natey F#m4","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"F#m4","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-05-13 14:49:19.928458	2025-05-13 14:49:19.928458
3	SW-1600	6637323682123	Michaela Vihs	M.vihs@yahoo.de	+491754978692	Bachstraße 3	Dorste	\N	37520	Germany	retail	f	\N	ordered	2025-05-12 21:03:03	\N		0	{"type":"Natey Am4","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"Am4","color":"Blue, with Terra and Gold Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-05-13 14:49:20.12324	2025-05-13 14:49:20.12324
4	SW-1599	6635132780875	James Steinbrecher	jamesesteinbrecher818@yahoo.com	+19062826644	137 Mission Ridge Overlook	hayesville	North Carolina	28904	United States	retail	f	\N	ordered	2025-05-11 22:59:30	\N		0	{"type":"Natey Am4","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"Am4","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-05-13 14:49:20.299986	2025-05-13 14:49:20.299986
5	SW-1598	6632168784203	Samora Yeboah	zuddha@hotmail.com	07568963160	45 Gaskill Street	Rochdale	England	OL10 4RB	United Kingdom	retail	f	\N	ordered	2025-05-10 09:09:49	\N		0	{"type":"Innato Gm3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Gm3","color":"Blue, with Terra and Gold Bubbles","key":"432 Hz","fulfillable_quantity":"1"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-05-13 14:49:20.471938	2025-05-13 14:49:20.471938
6	SW-1597	6630623412555	Octavian Iacob	kontakt@sonusoasis.de	01751517187	Falderstraße 35	Köln	\N	50999	Germany	retail	f	\N	ordered	2025-05-09 09:05:20	\N		0	{"type":"Innato Fm3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Fm3","color":"Smokefired Terra with Terra and bronze Bubbles","key":"432 Hz","fulfillable_quantity":"1"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-05-13 14:49:20.636231	2025-05-13 14:49:20.636231
7	SW-1596	6627566846283	Jean-Luc Kumpen	boekhouding@elaisawellness.com	+3289390996	Zetellaan 50, Elaisa Wellness - 50/2	Maasmechelen	\N	3630	Belgium	retail	f	\N	ordered	2025-05-07 12:49:36	\N		0	{"type":"Natey Cm4","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"Cm4","color":"Blue, with Terra and Gold Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-05-13 14:49:20.824303	2025-05-13 14:49:20.824303
8	SW-1595	6625981661515	allemoz corinne	allemoz.corinne@gmail.com	+33788259468	14 avenue des libellules	Villeparisis	\N	77270	France	retail	f	\N	ordered	2025-05-06 15:34:04	\N		0	{"type":"Natey G#m4","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"G#m4","color":"Smokefired Terra with Terra and bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-05-13 14:49:21.013571	2025-05-13 14:49:21.013571
10	SW-1593	6621806330187	Vittorio Cova	vitcovacova@gmail.com	+18325065139	5651 Doliver Drive	Houston	Texas	77056	United States	retail	f	\N	ordered	2025-05-03 23:42:49	\N		0	{"type":"Innato Gm3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Gm3","color":"Smokefired Terra with Terra and bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-05-13 14:49:21.796923	2025-05-13 14:49:21.796923
11	SW-1592	6617593643339	Susanna Gutmann	susanna.gutmann@gmail.com	+4367764111839	Kleinschoenau 37	Zwettl-Niederösterreich	\N	3533	Austria	retail	f	\N	ordered	2025-05-01 11:37:56	\N		0	{"type":"Innato Bm3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Bm3","color":"Smokefired black with Terra and Copper Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-05-13 14:49:21.96933	2025-05-13 14:49:21.96933
12	SW-1591	6605962412363	Marta paccagnella	paccagn@gmail.com	+447751773744	Flat 4 Banfield House, 4 Troubridge Square	London	England	E17 3GQ	United Kingdom	retail	f	\N	ordered	2025-04-23 18:24:11	\N		0	{"type":"ZEN flute Large","model":"ZEN","fluteType":"ZEN","tuningFrequency":"440Hz","frequency":"440","tuning":"L","color":"Blue, with Terra and Gold Bubbles","fulfillable_quantity":"1"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-05-13 14:49:22.137322	2025-05-13 14:49:22.137322
14	SW-1589	6598869025099	Jill Glozier	jillwerndly@hotmail.com	+447737403791	11 Moore Avenue	South Shields	England	NE34 6AA	United Kingdom	retail	f	\N	ordered	2025-04-19 08:32:15	\N		0	{"type":"Natey Dm4","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"Dm4","color":"Blue, with Terra and Gold Bubbles","key":"432 Hz","fulfillable_quantity":"1"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-05-13 14:49:22.510791	2025-05-13 14:49:22.510791
15	SW-1588	6598590628171	Oliver Dür	oliver.duer@gmail.com	6604830112	Hof 302	Reuthe	\N	6870	Austria	retail	f	\N	ordered	2025-04-18 21:27:55	\N		0	{"type":"Natey G#m4","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"G#m4","color":"Smokefired Terra with Terra and bronze Bubbles","key":"432 Hz","fulfillable_quantity":"1"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-05-13 14:49:22.6839	2025-05-13 14:49:22.6839
16	SW-1586	6596973330763	Wen Colenbrander	coltha@gmail.com	0653130517	Prinses Marijkelaan 19, 3hoog	Zeist	\N	3708 DA	Netherlands	retail	f	\N	ordered	2025-04-17 16:40:45	\N		0	{"type":"ZEN flute Medium","model":"ZEN","fluteType":"ZEN","tuningFrequency":"440Hz","frequency":"440","tuning":"M","color":"Smokefired Terra and Black","fulfillable_quantity":"1"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-05-13 14:49:22.878286	2025-05-13 14:49:22.878286
1	SW-2025-001	shopify_1234567890	John Doe	john@example.com	+31612345678	123 Main Street	Amsterdam	Noord-Holland	1011AB	NL	retail	f	\N	archived	2025-05-01 00:00:00	2025-05-25 00:00:00	First test order with a single Innato A3 flute	30	{"package_gift": "true", "include_card": "false"}	{"ordered": "2025-05-01T00:00:00.000Z", "validated": "2025-05-02T10:30:00.000Z", "building": "2025-05-03T14:45:00.000Z"}	\N	t	\N	\N	\N	\N	\N	\N	\N	2025-05-01 00:00:00	2025-05-13 14:49:18.294
13	SW-1590	6604801507659	Brennan Gudmundson	brennanmg1@gmail.com	(312) 848-0001	1307 West Erie Street, 2	Chicago	Illinois	60642	United States	retail	f	\N	ordered	2025-04-23 03:26:37	\N		0	{"type":"Innato Em4","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Em4","color":"Blue, with Terra and Gold Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-05-13 14:49:22.316765	2025-05-13 17:58:09.434
344	SW-1565	6546879086923	Ellie Strange	elliestrange66@gmail.com	+447715643409	Flat 6, Winn Court, Winn Road	Southampton	England	SO17 1UZ	United Kingdom	retail	f	\N	archived	2025-03-17 07:14:20	\N		0	{"type":"Natey G#m4","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"G#m4","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	{}	\N	t	\N	\N	\N	\N	\N	\N	\N	2025-05-13 14:57:02.577508	2025-05-13 14:57:18.169
341	SW-1568	6550745678155	Becky Hayling	meempster@gmail.com	07754220937	56 Cotswold Road	Bath	England	BA2 2DL	United Kingdom	retail	f	\N	archived	2025-03-19 22:20:41	\N		0	{"type":"Innato Cm4","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Cm4","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-05-13 14:57:02.117807	2025-05-13 18:02:49.18
340	SW-1570	6551805854027	Kerem Brule	kerembrule@gmail.com	+16195492924	1604 Northeast Bryant Street	Portland	Oregon	97211	United States	reseller	t	KEREM	archived	2025-03-20 17:58:08	\N		0	{"type":"Innato Dm4","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Dm4","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"0"}	{}	\N	t	\N	\N	\N	\N	\N	\N	\N	2025-05-13 14:57:01.845729	2025-05-13 18:11:59.398
343	SW-1566	6547863568715	R Frijns	rfrijns@planet.nl	+31650976676	Professor Huetlaan 17	Laag-Soeren	\N	6957 AP	Netherlands	retail	f	\N	archived	2025-03-17 18:35:51	\N		0	{"type":"Natey Am3","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"Am3","color":"Smokefired Terra with Terra and bronze Bubbles","key":"432 Hz","fulfillable_quantity":"1"}	{}	\N	t	\N	\N	\N	\N	\N	\N	\N	2025-05-13 14:57:02.431922	2025-05-13 14:57:18.237
342	SW-1567	6549184807243	Jimmy Ward	jimmyward@outlook.com	07914945610	27 Brownleaf Road	Brighton and Hove	England	BN2 6LD	United Kingdom	retail	f	\N	archived	2025-03-18 19:01:22	\N		0	{"type":"Natey Am4","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"Am4","color":"Blue, with Terra and Gold Bubbles","key":"432 Hz","fulfillable_quantity":"1"}	{}	\N	t	\N	\N	\N	\N	\N	\N	\N	2025-05-13 14:57:02.285759	2025-05-13 14:57:18.297
339	SW-1571	6551888167243	Nicholas Evers	nicoeversdesign@gmail.com	(415) 298-1608	1604 NE Bryant st.	Portland	Oregon	97211	United States	retail	f	\N	archived	2025-03-20 18:58:15	\N		0	{"type":"Innato Dm4","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Dm4","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	{}	\N	t	\N	\N	\N	\N	\N	\N	\N	2025-05-13 14:57:01.669053	2025-05-13 14:57:18.459
338	SW-1572	6552928977227	Thea Seuntiëns	thea_seuntiens@hotmail.com	+31402041423	Henry Hudsonhof 15	Valkenswaard	\N	5554 PC	Netherlands	retail	f	\N	archived	2025-03-21 14:39:01	\N		0	{"type":"Natey Cm4","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"Cm4","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	{}	\N	t	\N	\N	\N	\N	\N	\N	\N	2025-05-13 14:57:01.499467	2025-05-13 14:57:18.521
337	SW-1573	6556718399819	Hajo Seevers	hajo-seevers@web.de	+4915730023819	Südstrasse 3	Zürich	\N	8008	Switzerland	retail	f	\N	archived	2025-03-23 17:03:10	\N		0	{"type":"Innato Em4","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Em4","color":"Smokefired Terra and Black","key":"440 Hz","fulfillable_quantity":"0"}	{}	\N	t	\N	\N	\N	\N	\N	\N	\N	2025-05-13 14:57:01.347844	2025-05-13 14:57:18.587
334	SW-1576	6572894978379	Lucas Temple	lucas.van.temple@gmail.com	9046277455	72 Mandy Circle	Santa Rosa Beach	Florida	32459	United States	retail	f	\N	archived	2025-04-01 15:35:43	\N		0	{"type":"Natey Am4","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"Am4","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	{}	\N	t	\N	\N	\N	\N	\N	\N	\N	2025-05-13 14:57:00.899327	2025-05-13 14:57:18.764
333	SW-1577	6573507641675	Mia Malcyone	mia@ecospace.se	+46707515776	Synålsvägen 21	Bromma	\N	168 73	Sweden	retail	f	\N	archived	2025-04-02 01:15:41	\N		0	{"type":"Innato Em4","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Em4","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	{}	\N	t	\N	\N	\N	\N	\N	\N	\N	2025-05-13 14:57:00.749822	2025-05-13 14:57:18.832
332	SW-1578	6579398279499	Jessica Veksler	jessicaveksler@gmail.com	+14252601033	3833 Renton Ave S	Seattle	Washington	98108-1640	United States	retail	f	\N	archived	2025-04-06 05:18:28	\N		0	{"type":"Innato C#m4","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"C#m4","color":"Blue, with Terra and Gold Bubbles","key":"432 Hz","fulfillable_quantity":"1"}	{}	\N	t	\N	\N	\N	\N	\N	\N	\N	2025-05-13 14:57:00.59566	2025-05-13 14:57:18.898
331	SW-1579	6584069357899	Jacob Glum	autrix94@gmail.com	18453137099	11 Horicon Ave, apt 1	Warrensburg	New York	12885	United States	retail	f	\N	archived	2025-04-09 10:33:04	\N		0	{"type":"Innato Bbm3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Bbm3","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	{}	\N	t	\N	\N	\N	\N	\N	\N	\N	2025-05-13 14:57:00.452109	2025-05-13 14:57:18.959
329	SW-1582	6586534035787	Walter Nelson	cof40@yahoo.com	+13022704688	1051 Hickory Ridge Rd	Smyrna	Delaware	19977	United States	retail	f	\N	archived	2025-04-10 23:18:55	\N		0	{"type":"Natey Gm3","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"Gm3","color":"Blue, with Terra and Gold Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	{}	\N	t	\N	\N	\N	\N	\N	\N	\N	2025-05-13 14:57:00.105901	2025-05-13 14:57:19.126
328	SW-1583	6587931033931	Brittney Barnes	brittney.barnes93@gmail.com	9733429982	380 MT PROSPECT AVE, APT 14B	Newark	New Jersey	07104	United States	retail	f	\N	archived	2025-04-12 02:57:45	\N		0	{"type":"Innato Exploration Cards","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","fulfillable_quantity":"1"}	{}	\N	t	\N	\N	\N	\N	\N	\N	\N	2025-05-13 14:56:59.957855	2025-05-13 14:57:19.197
356	SW-1518	6432498909515	Philipp Krause	philmalighta@icloud.com	01725162543	Erfurter Strasse 1	Dresden	\N	01127	Germany	retail	f	\N	archived	2025-01-12 07:08:23	\N		0	{"type":"Double Large Native Am3","model":"DOUBLE","fluteType":"DOUBLE","tuningFrequency":"440Hz","frequency":"440","tuning":"Am3","color":"Blue, with Terra and Gold Bubbles","key":"432 Hz","fulfillable_quantity":"0"}	{}	\N	t	\N	\N	\N	\N	\N	\N	\N	2025-05-13 14:57:05.355757	2025-05-13 14:57:17.307
352	SW-1548	6501454086475	Miklós Heim-Tóth	miklos.toth2@gmail.com	+36704253440	Fő utca 89	Barnag	\N	8291	Hungary	retail	f	\N	archived	2025-02-27 11:06:21	\N		0	{"type":"Innato Am3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Am3","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	{}	\N	t	\N	\N	\N	\N	\N	\N	\N	2025-05-13 14:57:04.150153	2025-05-13 14:57:17.581
351	SW-1553	6530875687243	Lindsey Morris	lindseymorris777@gmail.com	+12089495413	1800 North New Hampshire Avenue, 114	Los Angeles	California	90027	United States	retail	f	\N	archived	2025-03-07 04:25:52	\N		0	{"type":"Natey Gm3","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"Gm3","color":"Smokefired Terra with Terra and bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	{}	\N	t	\N	\N	\N	\N	\N	\N	\N	2025-05-13 14:57:03.92344	2025-05-13 14:57:17.651
353	SW-1546	6499079258443	Aleksei Kalibin	a.atomsky@me.com	+34675994126	Malagankatu 4c, 69	Helsinki	\N	00220	Finland	retail	f	\N	archived	2025-02-25 19:46:07	\N		0	{"type":"Innato Em3 (NEW)","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Em3","color":"Blue, with Terra and Gold Bubbles","key":"432 Hz","fulfillable_quantity":"1"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-05-13 14:57:04.353808	2025-05-13 17:56:18.809
354	SW-1537	6461164749131	Max Schwanekamp	max@schwanekamp.org	+15416537672	3151 Storey Blvd	Eugene	Oregon	97405	United States	retail	f	\N	archived	2025-02-01 18:42:49	\N	New shipping adress	0	{"type":"Innato Am3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Am3","color":"Blue, with Terra and Gold Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	{}	\N	t	\N	\N	\N	\N	\N	\N	\N	2025-05-13 14:57:04.745358	2025-05-13 18:03:25.719
355	SW-1535	6454666559819	Katja Vonk	vonk.katja@hotmail.com	0610219196	Hanetangerweg 6, 6	Ter Apel	\N	9561 PE	Netherlands	retail	f	\N	archived	2025-01-27 18:18:31	\N		0	{"type":"Innato Exploration Cards","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","fulfillable_quantity":"1"}	{}	\N	t	\N	\N	\N	\N	\N	\N	\N	2025-05-13 14:57:04.917898	2025-05-15 07:13:55.532
336	SW-1574	6559540183371	Kerem Brule	kerembrule@gmail.com	+16195492924	9 Harbour Isle Drive East, Apt 102	Fort Pierce	Florida	34949	United States	retail	t	KEREM	archived	2025-03-25 16:28:18	\N		0	{"type":"Innato Bm3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Bm3","color":"Blue, with Terra and Gold Bubbles","key":"432 Hz","fulfillable_quantity":"1"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-05-13 14:57:01.203439	2025-05-13 18:02:56.862
347	SW-1561	6544465592651	Alejandro De Antonio	aldeantonioluthier@gmail.com	680697219	Calle Real 39B	Cañicosa	Segovia	40163	Spain	retail	f	\N	archived	2025-03-15 12:03:13	\N		0	{"type":"Innato Bm3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Bm3","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	{}	\N	t	\N	\N	\N	\N	\N	\N	\N	2025-05-13 14:57:03.043282	2025-05-13 14:57:17.975
346	SW-1563	6546511200587	Lotus Shields	shieldslotus@gmail.com	+447724084325	38 Trafalgar way	Braintree	England	CM7 9UX	United Kingdom	retail	f	\N	archived	2025-03-16 19:38:36	\N		0	{"type":"Innato Cm4","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Cm4","color":"Smokefired black with Terra and Copper Bubbles","key":"440 Hz","fulfillable_quantity":"0"}	{}	\N	t	\N	\N	\N	\N	\N	\N	\N	2025-05-13 14:57:02.872681	2025-05-13 14:57:18.041
345	SW-1564	6546625626443	Katherine Perry	kateperry94@gmail.com	+17608556228	770 Avenida Codorniz	San Marcos	California	92069	United States	retail	f	\N	archived	2025-03-16 21:00:41	\N		0	{"type":"Innato Em4","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Em4","color":"Blue, with Terra and Gold Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	{}	\N	t	\N	\N	\N	\N	\N	\N	\N	2025-05-13 14:57:02.725452	2025-05-13 14:57:18.09
327	SW-1584	6588193243467	Holly Mckenzie	thundertrix@yahoo.co.uk	+447904744950	14 Bridgend	Dunblane	Scotland	FK15 9ES	United Kingdom	retail	f	\N	archived	2025-04-12 09:02:34	\N		0	{"type":"ZEN flute Medium","model":"ZEN","fluteType":"ZEN","tuningFrequency":"440Hz","frequency":"440","tuning":"M","color":"Smokefired Terra and Black","fulfillable_quantity":"1"}	{}	\N	t	\N	\N	\N	\N	\N	\N	\N	2025-05-13 14:56:59.802538	2025-05-13 14:57:19.258
357	SW-1515	6428373549387	Marvin Schwarz	kalleklopps00@gmail.com	+491781135275	Hauptstraße 9	Göggingen	\N	73571	Germany	retail	f	\N	archived	2025-01-08 23:34:22	\N		0	{"type":"Double Medium Native Bbm3","model":"DOUBLE","fluteType":"DOUBLE","tuningFrequency":"440Hz","frequency":"440","tuning":"Bbm3","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"0"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-05-13 15:18:48.479108	2025-05-13 15:19:36.117
349	SW-1559	6544418373963	Billy Zanski	info@skinnybeatsdrums.com	\N	4 Eagle Street	Asheville	North Carolina	28801	United States	reseller	t	BILLY	archived	2025-03-15 11:33:37	\N		0	{"type":"Innato Am3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Am3","color":"Blue, with Terra and Gold Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	{}	\N	t	\N	\N	\N	\N	\N	\N	\N	2025-05-13 14:57:03.442829	2025-05-13 18:01:56.827
348	SW-1560	6544442523979	Billy Zanski	info@skinnybeatsdrums.com	\N	4 Eagle Street	Asheville	North Carolina	28801	United States	retail	t	BILLY	archived	2025-03-15 11:48:32	\N		0	{"type":"Innato Am3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Am3","color":"Blue, with Terra and Gold Bubbles","key":"440 Hz","fulfillable_quantity":"0"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-05-13 14:57:03.189607	2025-05-13 18:02:05.178
335	SW-1575	6572002148683	Marc Footman	marc_footman@hotmail.com	+447415129883	89, Parkside Crescent	Telford	England	TF1 5GT	United Kingdom	retail	f	\N	archived	2025-04-01 00:04:10	\N		0	{"type":"Natey Dm4","model":"NATEY","fluteType":"NATEY","tuningFrequency":"440Hz","frequency":"440","tuning":"Dm4","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-05-13 14:57:01.054073	2025-05-13 17:56:58.213
350	SW-1557	6537826173259	Raquel Jensen	rjrpaintings@gmail.com	2064464150	4213 Basswood Rd	Freeland	Washington	98249	United States	retail	f	\N	archived	2025-03-10 22:15:55	\N		0	{"type":"Innato Am3","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Am3","color":"Smokefired Terra with Terra and bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	{}	\N	t	\N	\N	\N	\N	\N	\N	\N	2025-05-13 14:57:03.722203	2025-05-15 07:13:54.387
330	SW-1580	6585441255755	Iselin Grayston	iselin.grayston@gmail.com	+4799323643	Ramshaugvegen 24	Bryne	\N	4340	Norway	retail	f	\N	archived	2025-04-10 09:24:28	\N		0	{"type":"Innato Cm4","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Cm4","color":"Blue, with Terra and Gold Bubbles","key":"432 Hz","fulfillable_quantity":"1"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-05-13 14:57:00.270412	2025-05-13 18:02:34.822
17	SW-1585	6590855250251	John Martin	jdalmartin@hotmail.com	2503338599	561 NOOTKA RD, Nootka Road	QUALICUM BEACH	British Columbia	V9K 1A3	Canada	retail	f	\N	archived	2025-04-13 22:26:16	\N		0	{"type":"Innato Dm4","model":"INNATO","fluteType":"INNATO","tuningFrequency":"440Hz","frequency":"440","tuning":"Dm4","color":"Smokefired Blue with Red and Bronze Bubbles","key":"440 Hz","fulfillable_quantity":"1"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-05-13 14:49:23.054115	2025-05-14 02:59:44.48
\.


--
-- TOC entry 3515 (class 0 OID 16584)
-- Dependencies: 232
-- Data for Name: production_notes; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.production_notes (id, order_id, item_id, note, created_by, source, created_at) FROM stdin;
1	1	1	Order validated and materials reserved	system	internal	2025-05-02 10:30:00
2	1	1	Started building process for Innato A3	Marco	internal	2025-05-03 14:45:00
\.


--
-- TOC entry 3517 (class 0 OID 16595)
-- Dependencies: 234
-- Data for Name: resellers; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.resellers (id, name, nickname, business_name, contact_name, email, phone, address, city, state, zip, country, discount_percentage, is_active, notes, last_order_date, created_at, updated_at) FROM stdin;
15	Melody Market	MelodyMkt	Melody Market LLC	John Smith	contact@melodymarket.com	+1-555-123-4567	123 Music Lane	Harmony	CA	90001	USA	15	t	Primary reseller for California region	\N	2025-05-13 15:24:14.062012	2025-05-13 15:24:14.062012
16	Harmony House	HarmonyHs	Harmony House Inc	Jane Doe	jane@harmonyhouse.com	+1-555-987-6543	456 Tune Avenue	Musicville	NY	10001	USA	10	t	East coast distributor	\N	2025-05-13 15:24:14.062012	2025-05-13 15:24:14.062012
17	Mystical Sounds	MystSound	Mystical Sounds GmbH	Hans Mueller	info@mysticalsounds.de	+49-555-1234	Klangstrasse 78	Berlin	BE	10115	Germany	20	t	European distributor	\N	2025-05-13 15:24:14.062012	2025-05-13 15:24:14.062012
25	BILLY	BILLY	\N	Billy Zanski	info@skinnybeatsdrums.com		4 Eagle Street	Asheville	North Carolina	28801	United States	0	t	Auto-created from order 349	\N	2025-05-13 18:01:56.792	2025-05-13 18:01:56.792
26	ALAN	ALAN	\N	Alan Tower	alan@theresonancecenter.com		2045 Meridian Avenue, Apt A	South Pasadena	California	91030	United States	0	t	Auto-created from order 9	\N	2025-05-13 18:02:14.218	2025-05-13 18:02:14.218
27	KEREM	KEREM	\N	Kerem Brule	kerembrule@gmail.com	+16195492924	9 Harbour Isle Drive East, Apt 102	Fort Pierce	Florida	34949	United States	0	t	Auto-created from order 336	\N	2025-05-13 18:02:56.826	2025-05-13 18:02:56.826
\.


--
-- TOC entry 3522 (class 0 OID 32768)
-- Dependencies: 239
-- Data for Name: session; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.session (sid, sess, expire) FROM stdin;
gx9QGqZLqO33xt4VETNeHv3bqWlvIXEc	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-12T11:09:00.321Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-06-12 11:09:03
rJy6buCCL_65qaS8fbLUWqglVbJzbbUD	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-12T20:51:44.846Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-06-12 20:51:58
PKC8PYuczIM-hXDExAlIknDJtvtdb7XK	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-12T20:45:01.774Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-06-12 20:45:02
FTTGdV4t-YB93QeKkOTUqRqZPr0qu1vN	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-13T12:41:26.186Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-06-13 14:38:00
Hy18vl3yZx-gg-2xfBpvv8e7l0GiDyBL	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-12T14:50:20.145Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-06-12 15:25:05
dzpoPUXt_dFtaGpEWE-AO7vRdYSHHJcR	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-12T18:13:01.907Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-06-12 19:11:11
acNVDGAKcw3nsuunhUos8Dnz5feO7VP1	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-13T14:34:34.105Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-06-13 17:22:53
mOlHYRxocEabm5t1He2FcBF_TV9w4Wjg	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-12T20:59:34.754Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-06-14 07:20:00
oN1N2OyMmOsSDyszAS5gJoru-P6h2S70	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-12T14:46:07.352Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-06-14 07:20:14
ZFNe3M-FORv35hgN3IHeLdXFEweJTtEF	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-13T12:39:55.421Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-06-13 12:40:59
fpNRyK5pk9SAMAQX3oK_2e8-n8i3aSRz	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-13T03:01:50.688Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-06-14 05:12:46
LA3Gx039CbzkKDrHjIYLsQY6F485Ikoz	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-12T20:18:51.504Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-06-12 20:40:17
\.


--
-- TOC entry 3519 (class 0 OID 16611)
-- Dependencies: 236
-- Data for Name: shopify_item_tracking; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) FROM stdin;
323	328	[1]	[{"shopifyLineItemId":"16568669241675","suffix":1,"title":"Innato Exploration Cards"}]	2025-05-13 14:57:00.005	2025-05-15 07:13:50.507
324	329	[1]	[{"shopifyLineItemId":"16565900673355","suffix":1,"title":"Natey Gm3"}]	2025-05-13 14:57:00.152	2025-05-15 07:13:50.673
325	330	[1,2]	[{"shopifyLineItemId":"16563508445515","suffix":1,"title":"Innato Cm4"},{"shopifyLineItemId":"16563508478283","suffix":2,"title":"Innato Fm3"}]	2025-05-13 14:57:00.354	2025-05-15 07:13:50.944
326	331	[1]	[{"shopifyLineItemId":"16560707633483","suffix":1,"title":"Innato Bbm3"}]	2025-05-13 14:57:00.498	2025-05-15 07:13:51.151
327	332	[1]	[{"shopifyLineItemId":"16550977012043","suffix":1,"title":"Innato C#m4"}]	2025-05-13 14:57:00.644	2025-05-15 07:13:51.333
328	333	[1]	[{"shopifyLineItemId":"16538871071051","suffix":1,"title":"Innato Em4"}]	2025-05-13 14:57:00.798	2025-05-15 07:13:51.503
1	2	[1]	[{"shopifyLineItemId":"16667050344779","suffix":1,"title":"Natey F#m4"}]	2025-05-13 14:49:20.008	2025-05-15 07:13:47.294
2	3	[1]	[{"shopifyLineItemId":"16665201705291","suffix":1,"title":"Natey Am4"}]	2025-05-13 14:49:20.181	2025-05-15 07:13:47.492
3	4	[1]	[{"shopifyLineItemId":"16661413200203","suffix":1,"title":"Natey Am4"}]	2025-05-13 14:49:20.359	2025-05-15 07:13:47.692
4	5	[1]	[{"shopifyLineItemId":"16655963980107","suffix":1,"title":"Innato Gm3"}]	2025-05-13 14:49:20.52	2025-05-15 07:13:47.891
329	334	[1]	[{"shopifyLineItemId":"16537558319435","suffix":1,"title":"Natey Am4"}]	2025-05-13 14:57:00.953	2025-05-15 07:13:51.679
330	335	[1]	[{"shopifyLineItemId":"16535593353547","suffix":1,"title":"Natey Dm4"}]	2025-05-13 14:57:01.102	2025-05-15 07:13:51.849
331	336	[1]	[{"shopifyLineItemId":"16509335044427","suffix":1,"title":"Innato Bm3"}]	2025-05-13 14:57:01.25	2025-05-15 07:13:51.984
5	6	[1]	[{"shopifyLineItemId":"16652674072907","suffix":1,"title":"Innato Fm3"}]	2025-05-13 14:49:20.7	2025-05-15 07:13:48.074
332	337	[1]	[{"shopifyLineItemId":"16503235281227","suffix":1,"title":"Innato Em4"}]	2025-05-13 14:57:01.394	2025-05-15 07:13:52.151
6	7	[1]	[{"shopifyLineItemId":"16646644695371","suffix":1,"title":"Natey Cm4"}]	2025-05-13 14:49:20.875	2025-05-15 07:13:48.244
333	338	[1]	[{"shopifyLineItemId":"16496935403851","suffix":1,"title":"Natey Cm4"}]	2025-05-13 14:57:01.551	2025-05-15 07:13:52.332
7	8	[1]	[{"shopifyLineItemId":"16643297050955","suffix":1,"title":"Natey G#m4"}]	2025-05-13 14:49:21.065	2025-05-15 07:13:48.419
9	10	[1]	[{"shopifyLineItemId":"16634801291595","suffix":1,"title":"Innato Gm3"}]	2025-05-13 14:49:21.848	2025-05-15 07:13:48.966
11	12	[1]	[{"shopifyLineItemId":"16604072411467","suffix":1,"title":"ZEN flute Large"}]	2025-05-13 14:49:22.188	2025-05-15 07:13:49.302
12	13	[1]	[{"shopifyLineItemId":"16601674613067","suffix":1,"title":"Innato Em4"}]	2025-05-13 14:49:22.377	2025-05-15 07:13:49.476
13	14	[1]	[{"shopifyLineItemId":"16590850326859","suffix":1,"title":"Natey Dm4"}]	2025-05-13 14:49:22.562	2025-05-15 07:13:49.648
334	339	[1]	[{"shopifyLineItemId":"16494827569483","suffix":1,"title":"Innato Dm4"}]	2025-05-13 14:57:01.724	2025-05-15 07:13:52.506
335	340	[1]	[{"shopifyLineItemId":"16494657077579","suffix":1,"title":"Innato Dm4"}]	2025-05-13 14:57:01.898	2025-05-15 07:13:52.651
336	341	[1]	[{"shopifyLineItemId":"16492498616651","suffix":1,"title":"Innato Cm4"}]	2025-05-13 14:57:02.173	2025-05-15 07:13:52.849
337	342	[1]	[{"shopifyLineItemId":"16489221980491","suffix":1,"title":"Natey Am4"}]	2025-05-13 14:57:02.333	2025-05-15 07:13:53.015
338	343	[1]	[{"shopifyLineItemId":"16486560072011","suffix":1,"title":"Natey Am3"}]	2025-05-13 14:57:02.479	2025-05-15 07:13:53.192
339	344	[1]	[{"shopifyLineItemId":"16484188782923","suffix":1,"title":"Natey G#m4"}]	2025-05-13 14:57:02.625	2025-05-15 07:13:53.363
340	345	[1]	[{"shopifyLineItemId":"16483698901323","suffix":1,"title":"Innato Em4"}]	2025-05-13 14:57:02.772	2025-05-15 07:13:53.527
14	15	[1]	[{"shopifyLineItemId":"16590322794827","suffix":1,"title":"Natey G#m4"}]	2025-05-13 14:49:22.74	2025-05-15 07:13:49.814
15	16	[1]	[{"shopifyLineItemId":"16587053236555","suffix":1,"title":"ZEN flute Medium"}]	2025-05-13 14:49:22.943	2025-05-15 07:13:50.001
16	17	[1]	[{"shopifyLineItemId":"16574528029003","suffix":1,"title":"Innato Dm4"}]	2025-05-13 14:49:23.105	2025-05-15 07:13:50.178
322	327	[1]	[{"shopifyLineItemId":"16569193529675","suffix":1,"title":"ZEN flute Medium"}]	2025-05-13 14:56:59.854	2025-05-15 07:13:50.345
350	355	[1]	[{"shopifyLineItemId":"16304363110731","suffix":1,"title":"Innato Exploration Cards"}]	2025-05-13 14:57:04.966	2025-05-13 14:57:04.966
10	11	[1]	[{"shopifyLineItemId":"16626680430923","suffix":1,"title":"Innato Bm3"}]	2025-05-13 14:49:22.026	2025-05-15 07:13:49.129
341	346	[1]	[{"shopifyLineItemId":"16483464118603","suffix":1,"title":"Innato Cm4"}]	2025-05-13 14:57:02.924	2025-05-15 07:13:53.709
342	347	[1]	[{"shopifyLineItemId":"16479462719819","suffix":1,"title":"Innato Bm3"}]	2025-05-13 14:57:03.091	2025-05-15 07:13:53.908
343	348	[1,2,3,4]	[{"shopifyLineItemId":"16479417991499","suffix":1,"title":"Innato Am3"},{"shopifyLineItemId":"16479418024267","suffix":2,"title":"Innato Am3"},{"shopifyLineItemId":"16479418057035","suffix":3,"title":"Innato Em3 (NEW)"},{"shopifyLineItemId":"16479418089803","suffix":4,"title":"Innato G#m3"}]	2025-05-13 14:57:03.345	2025-05-15 07:13:54.039
344	349	[1,2,3,4]	[{"shopifyLineItemId":"16479365464395","suffix":1,"title":"Innato Am3"},{"shopifyLineItemId":"16479365497163","suffix":2,"title":"Innato Am3"},{"shopifyLineItemId":"16479365529931","suffix":3,"title":"Innato Em3 (NEW)"},{"shopifyLineItemId":"16479365562699","suffix":4,"title":"Innato G#m3"}]	2025-05-13 14:57:03.6	2025-05-15 07:13:54.248
346	351	[1]	[{"shopifyLineItemId":"16451904012619","suffix":1,"title":"Natey Gm3"}]	2025-05-13 14:57:03.97	2025-05-15 07:13:54.654
347	352	[1]	[{"shopifyLineItemId":"16396443451723","suffix":1,"title":"Innato Am3"}]	2025-05-13 14:57:04.219	2025-05-15 07:13:54.928
348	353	[1]	[{"shopifyLineItemId":"16391832273227","suffix":1,"title":"Innato Em3 (NEW)"}]	2025-05-13 14:57:04.402	2025-05-15 07:13:55.118
345	350	[1]	[{"shopifyLineItemId":"16465822089547","suffix":1,"title":"Innato Am3"}]	2025-05-13 14:57:03.768	2025-05-13 15:01:47.072
349	354	[1]	[{"shopifyLineItemId":"16317989617995","suffix":1,"title":"Innato Am3"}]	2025-05-13 14:57:04.797	2025-05-15 07:13:55.457
351	356	[1]	[{"shopifyLineItemId":"16260633428299","suffix":1,"title":"Double Large Native Am3"}]	2025-05-13 14:57:05.403	2025-05-15 07:13:56.004
352	357	[1]	[{"shopifyLineItemId":"16251654799691","suffix":1,"title":"Double Medium Native Bbm3"}]	2025-05-13 15:18:48.603	2025-05-15 07:13:56.211
8	9	[1,2,3,4,5,6,7,8,9,10,11,12]	[{"shopifyLineItemId":"16637598400843","suffix":1,"title":"Innato Am3"},{"shopifyLineItemId":"16637598433611","suffix":2,"title":"Innato Am3"},{"shopifyLineItemId":"16637598466379","suffix":3,"title":"Innato Bbm3"},{"shopifyLineItemId":"16637598499147","suffix":4,"title":"Innato Bbm3"},{"shopifyLineItemId":"16637598531915","suffix":5,"title":"Innato Bm3"},{"shopifyLineItemId":"16637598564683","suffix":6,"title":"Innato Bm3"},{"shopifyLineItemId":"16637598597451","suffix":7,"title":"Innato Bm3"},{"shopifyLineItemId":"16637598630219","suffix":8,"title":"Innato Cm4"},{"shopifyLineItemId":"16637598662987","suffix":9,"title":"Innato Cm4"},{"shopifyLineItemId":"16637598695755","suffix":10,"title":"Innato Cm4"},{"shopifyLineItemId":"16637598728523","suffix":11,"title":"Innato Dm4"},{"shopifyLineItemId":"16637598761291","suffix":12,"title":"Innato Em4"}]	2025-05-13 14:49:21.681	2025-05-15 07:13:48.558
\.


--
-- TOC entry 3521 (class 0 OID 16624)
-- Dependencies: 238
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.users (id, username, password, current_challenge, device_id, remember_token, last_login) FROM stdin;
1	admin	8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92.81dc9bdb52d04dc20036dbd8313ed055	\N	\N	\N	2025-05-10 08:30:15
2	marco	8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92.81dc9bdb52d04dc20036dbd8313ed055	\N	\N	\N	2025-05-09 16:45:30
3	workshop	8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92.81dc9bdb52d04dc20036dbd8313ed055	\N	\N	\N	2025-05-10 12:15:25
\.


--
-- TOC entry 3541 (class 0 OID 0)
-- Dependencies: 215
-- Name: instrument_inventory_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.instrument_inventory_id_seq', 1, true);


--
-- TOC entry 3542 (class 0 OID 0)
-- Dependencies: 217
-- Name: material_mapping_rules_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.material_mapping_rules_id_seq', 1, false);


--
-- TOC entry 3543 (class 0 OID 0)
-- Dependencies: 219
-- Name: materials_inventory_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.materials_inventory_id_seq', 2, true);


--
-- TOC entry 3544 (class 0 OID 0)
-- Dependencies: 221
-- Name: mold_inventory_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.mold_inventory_id_seq', 56, true);


--
-- TOC entry 3545 (class 0 OID 0)
-- Dependencies: 223
-- Name: mold_mapping_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.mold_mapping_items_id_seq', 109, true);


--
-- TOC entry 3546 (class 0 OID 0)
-- Dependencies: 225
-- Name: mold_mappings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.mold_mappings_id_seq', 78, true);


--
-- TOC entry 3547 (class 0 OID 0)
-- Dependencies: 227
-- Name: order_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.order_items_id_seq', 4313, true);


--
-- TOC entry 3548 (class 0 OID 0)
-- Dependencies: 229
-- Name: orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.orders_id_seq', 357, true);


--
-- TOC entry 3549 (class 0 OID 0)
-- Dependencies: 231
-- Name: production_notes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.production_notes_id_seq', 1, false);


--
-- TOC entry 3550 (class 0 OID 0)
-- Dependencies: 233
-- Name: resellers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.resellers_id_seq', 27, true);


--
-- TOC entry 3551 (class 0 OID 0)
-- Dependencies: 235
-- Name: shopify_item_tracking_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.shopify_item_tracking_id_seq', 352, true);


--
-- TOC entry 3552 (class 0 OID 0)
-- Dependencies: 237
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.users_id_seq', 1, false);


--
-- TOC entry 3298 (class 2606 OID 16483)
-- Name: instrument_inventory instrument_inventory_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.instrument_inventory
    ADD CONSTRAINT instrument_inventory_pkey PRIMARY KEY (id);


--
-- TOC entry 3300 (class 2606 OID 24588)
-- Name: instrument_inventory instrument_inventory_serial_number_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.instrument_inventory
    ADD CONSTRAINT instrument_inventory_serial_number_key UNIQUE (serial_number);


--
-- TOC entry 3302 (class 2606 OID 16485)
-- Name: instrument_inventory instrument_inventory_serial_number_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.instrument_inventory
    ADD CONSTRAINT instrument_inventory_serial_number_unique UNIQUE (serial_number);


--
-- TOC entry 3304 (class 2606 OID 16498)
-- Name: material_mapping_rules material_mapping_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.material_mapping_rules
    ADD CONSTRAINT material_mapping_rules_pkey PRIMARY KEY (id);


--
-- TOC entry 3306 (class 2606 OID 16512)
-- Name: materials_inventory materials_inventory_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.materials_inventory
    ADD CONSTRAINT materials_inventory_pkey PRIMARY KEY (id);


--
-- TOC entry 3308 (class 2606 OID 16525)
-- Name: mold_inventory mold_inventory_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.mold_inventory
    ADD CONSTRAINT mold_inventory_pkey PRIMARY KEY (id);


--
-- TOC entry 3310 (class 2606 OID 16534)
-- Name: mold_mapping_items mold_mapping_items_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.mold_mapping_items
    ADD CONSTRAINT mold_mapping_items_pkey PRIMARY KEY (id);


--
-- TOC entry 3312 (class 2606 OID 16546)
-- Name: mold_mappings mold_mappings_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.mold_mappings
    ADD CONSTRAINT mold_mappings_pkey PRIMARY KEY (id);


--
-- TOC entry 3314 (class 2606 OID 24590)
-- Name: mold_mappings mold_mappings_unique_type_tuning; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.mold_mappings
    ADD CONSTRAINT mold_mappings_unique_type_tuning UNIQUE (instrument_type, tuning_note);


--
-- TOC entry 3317 (class 2606 OID 16561)
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- TOC entry 3319 (class 2606 OID 24592)
-- Name: order_items order_items_serial_number_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_serial_number_key UNIQUE (serial_number);


--
-- TOC entry 3321 (class 2606 OID 16563)
-- Name: order_items order_items_serial_number_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_serial_number_unique UNIQUE (serial_number);


--
-- TOC entry 3323 (class 2606 OID 40973)
-- Name: orders orders_order_number_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_order_number_key UNIQUE (order_number);


--
-- TOC entry 3325 (class 2606 OID 16582)
-- Name: orders orders_order_number_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_order_number_unique UNIQUE (order_number);


--
-- TOC entry 3327 (class 2606 OID 16580)
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- TOC entry 3329 (class 2606 OID 24594)
-- Name: orders orders_unique_order_number; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_unique_order_number UNIQUE (order_number);


--
-- TOC entry 3331 (class 2606 OID 16593)
-- Name: production_notes production_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.production_notes
    ADD CONSTRAINT production_notes_pkey PRIMARY KEY (id);


--
-- TOC entry 3333 (class 2606 OID 24596)
-- Name: resellers resellers_nickname_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.resellers
    ADD CONSTRAINT resellers_nickname_key UNIQUE (nickname);


--
-- TOC entry 3335 (class 2606 OID 16609)
-- Name: resellers resellers_nickname_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.resellers
    ADD CONSTRAINT resellers_nickname_unique UNIQUE (nickname);


--
-- TOC entry 3337 (class 2606 OID 16607)
-- Name: resellers resellers_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.resellers
    ADD CONSTRAINT resellers_pkey PRIMARY KEY (id);


--
-- TOC entry 3348 (class 2606 OID 32774)
-- Name: session session_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (sid);


--
-- TOC entry 3339 (class 2606 OID 16622)
-- Name: shopify_item_tracking shopify_item_tracking_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.shopify_item_tracking
    ADD CONSTRAINT shopify_item_tracking_pkey PRIMARY KEY (id);


--
-- TOC entry 3341 (class 2606 OID 16631)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 3343 (class 2606 OID 24598)
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- TOC entry 3345 (class 2606 OID 16633)
-- Name: users users_username_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_unique UNIQUE (username);


--
-- TOC entry 3346 (class 1259 OID 32775)
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "IDX_session_expire" ON public.session USING btree (expire);


--
-- TOC entry 3315 (class 1259 OID 40974)
-- Name: idx_order_items_shopify_line_item_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_order_items_shopify_line_item_id ON public.order_items USING btree (shopify_line_item_id);


--
-- TOC entry 3349 (class 2606 OID 24599)
-- Name: mold_mapping_items mold_mapping_items_mapping_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.mold_mapping_items
    ADD CONSTRAINT mold_mapping_items_mapping_id_fkey FOREIGN KEY (mapping_id) REFERENCES public.mold_mappings(id) ON DELETE CASCADE;


--
-- TOC entry 3350 (class 2606 OID 24604)
-- Name: mold_mapping_items mold_mapping_items_mold_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.mold_mapping_items
    ADD CONSTRAINT mold_mapping_items_mold_id_fkey FOREIGN KEY (mold_id) REFERENCES public.mold_inventory(id) ON DELETE CASCADE;


--
-- TOC entry 3351 (class 2606 OID 24609)
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- TOC entry 3352 (class 2606 OID 24614)
-- Name: production_notes production_notes_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.production_notes
    ADD CONSTRAINT production_notes_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.order_items(id) ON DELETE SET NULL;


--
-- TOC entry 3353 (class 2606 OID 24619)
-- Name: production_notes production_notes_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.production_notes
    ADD CONSTRAINT production_notes_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- TOC entry 3354 (class 2606 OID 24624)
-- Name: shopify_item_tracking shopify_item_tracking_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.shopify_item_tracking
    ADD CONSTRAINT shopify_item_tracking_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- TOC entry 2098 (class 826 OID 16392)
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- TOC entry 2097 (class 826 OID 16391)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


-- Completed on 2025-05-15 07:20:18 UTC

--
-- PostgreSQL database dump complete
--

