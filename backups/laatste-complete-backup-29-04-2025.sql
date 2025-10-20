--
-- PostgreSQL database dump
--

-- Dumped from database version 16.8
-- Dumped by pg_dump version 16.5

-- Started on 2025-04-29 20:22:49 UTC

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
-- TOC entry 227 (class 1259 OID 32839)
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
-- TOC entry 226 (class 1259 OID 32838)
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
-- TOC entry 3504 (class 0 OID 0)
-- Dependencies: 226
-- Name: instrument_inventory_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.instrument_inventory_id_seq OWNED BY public.instrument_inventory.id;


--
-- TOC entry 229 (class 1259 OID 32853)
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
-- TOC entry 228 (class 1259 OID 32852)
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
-- TOC entry 3505 (class 0 OID 0)
-- Dependencies: 228
-- Name: material_mapping_rules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.material_mapping_rules_id_seq OWNED BY public.material_mapping_rules.id;


--
-- TOC entry 225 (class 1259 OID 32825)
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
-- TOC entry 224 (class 1259 OID 32824)
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
-- TOC entry 3506 (class 0 OID 0)
-- Dependencies: 224
-- Name: materials_inventory_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.materials_inventory_id_seq OWNED BY public.materials_inventory.id;


--
-- TOC entry 231 (class 1259 OID 32866)
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
-- TOC entry 230 (class 1259 OID 32865)
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
-- TOC entry 3507 (class 0 OID 0)
-- Dependencies: 230
-- Name: mold_inventory_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.mold_inventory_id_seq OWNED BY public.mold_inventory.id;


--
-- TOC entry 235 (class 1259 OID 32891)
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
-- TOC entry 234 (class 1259 OID 32890)
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
-- TOC entry 3508 (class 0 OID 0)
-- Dependencies: 234
-- Name: mold_mapping_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.mold_mapping_items_id_seq OWNED BY public.mold_mapping_items.id;


--
-- TOC entry 233 (class 1259 OID 32879)
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
-- TOC entry 232 (class 1259 OID 32878)
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
-- TOC entry 3509 (class 0 OID 0)
-- Dependencies: 232
-- Name: mold_mappings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.mold_mappings_id_seq OWNED BY public.mold_mappings.id;


--
-- TOC entry 221 (class 1259 OID 32799)
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
    specifications jsonb,
    status text DEFAULT 'ordered'::text NOT NULL,
    progress integer DEFAULT 0,
    status_change_dates jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    is_archived boolean DEFAULT false,
    archived_reason text
);


ALTER TABLE public.order_items OWNER TO neondb_owner;

--
-- TOC entry 220 (class 1259 OID 32798)
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
-- TOC entry 3510 (class 0 OID 0)
-- Dependencies: 220
-- Name: order_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.order_items_id_seq OWNED BY public.order_items.id;


--
-- TOC entry 219 (class 1259 OID 32780)
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
    specifications jsonb,
    status_change_dates jsonb DEFAULT '{}'::jsonb,
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
-- TOC entry 218 (class 1259 OID 32779)
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
-- TOC entry 3511 (class 0 OID 0)
-- Dependencies: 218
-- Name: orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.orders_id_seq OWNED BY public.orders.id;


--
-- TOC entry 223 (class 1259 OID 32815)
-- Name: production_notes; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.production_notes (
    id integer NOT NULL,
    order_id integer NOT NULL,
    item_id integer,
    note text NOT NULL,
    created_by text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    source character varying(50)
);


ALTER TABLE public.production_notes OWNER TO neondb_owner;

--
-- TOC entry 222 (class 1259 OID 32814)
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
-- TOC entry 3512 (class 0 OID 0)
-- Dependencies: 222
-- Name: production_notes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.production_notes_id_seq OWNED BY public.production_notes.id;


--
-- TOC entry 237 (class 1259 OID 49153)
-- Name: resellers; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.resellers (
    id integer NOT NULL,
    nickname text NOT NULL,
    full_name text,
    email text,
    phone text,
    shipping_address text,
    discount_percentage integer,
    notes text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    name text,
    business_name text,
    contact_name text,
    address text,
    city text,
    state text,
    zip text,
    country text DEFAULT 'US'::text,
    last_order_date timestamp without time zone
);


ALTER TABLE public.resellers OWNER TO neondb_owner;

--
-- TOC entry 236 (class 1259 OID 49152)
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
-- TOC entry 3513 (class 0 OID 0)
-- Dependencies: 236
-- Name: resellers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.resellers_id_seq OWNED BY public.resellers.id;


--
-- TOC entry 215 (class 1259 OID 24576)
-- Name: session; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.session (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp(6) without time zone NOT NULL
);


ALTER TABLE public.session OWNER TO neondb_owner;

--
-- TOC entry 239 (class 1259 OID 573504)
-- Name: shopify_item_tracking; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.shopify_item_tracking (
    id integer NOT NULL,
    order_id integer NOT NULL,
    used_suffixes jsonb DEFAULT '[]'::jsonb NOT NULL,
    item_mappings jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.shopify_item_tracking OWNER TO neondb_owner;

--
-- TOC entry 238 (class 1259 OID 573503)
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
-- TOC entry 3514 (class 0 OID 0)
-- Dependencies: 238
-- Name: shopify_item_tracking_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.shopify_item_tracking_id_seq OWNED BY public.shopify_item_tracking.id;


--
-- TOC entry 217 (class 1259 OID 32769)
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
-- TOC entry 216 (class 1259 OID 32768)
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
-- TOC entry 3515 (class 0 OID 0)
-- Dependencies: 216
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 3264 (class 2604 OID 573656)
-- Name: instrument_inventory id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.instrument_inventory ALTER COLUMN id SET DEFAULT nextval('public.instrument_inventory_id_seq'::regclass);


--
-- TOC entry 3268 (class 2604 OID 573657)
-- Name: material_mapping_rules id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.material_mapping_rules ALTER COLUMN id SET DEFAULT nextval('public.material_mapping_rules_id_seq'::regclass);


--
-- TOC entry 3258 (class 2604 OID 573658)
-- Name: materials_inventory id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.materials_inventory ALTER COLUMN id SET DEFAULT nextval('public.materials_inventory_id_seq'::regclass);


--
-- TOC entry 3273 (class 2604 OID 573659)
-- Name: mold_inventory id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.mold_inventory ALTER COLUMN id SET DEFAULT nextval('public.mold_inventory_id_seq'::regclass);


--
-- TOC entry 3282 (class 2604 OID 573660)
-- Name: mold_mapping_items id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.mold_mapping_items ALTER COLUMN id SET DEFAULT nextval('public.mold_mapping_items_id_seq'::regclass);


--
-- TOC entry 3278 (class 2604 OID 573661)
-- Name: mold_mappings id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.mold_mappings ALTER COLUMN id SET DEFAULT nextval('public.mold_mappings_id_seq'::regclass);


--
-- TOC entry 3249 (class 2604 OID 573662)
-- Name: order_items id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.order_items ALTER COLUMN id SET DEFAULT nextval('public.order_items_id_seq'::regclass);


--
-- TOC entry 3240 (class 2604 OID 573663)
-- Name: orders id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);


--
-- TOC entry 3256 (class 2604 OID 573664)
-- Name: production_notes id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.production_notes ALTER COLUMN id SET DEFAULT nextval('public.production_notes_id_seq'::regclass);


--
-- TOC entry 3285 (class 2604 OID 573665)
-- Name: resellers id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.resellers ALTER COLUMN id SET DEFAULT nextval('public.resellers_id_seq'::regclass);


--
-- TOC entry 3290 (class 2604 OID 573507)
-- Name: shopify_item_tracking id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.shopify_item_tracking ALTER COLUMN id SET DEFAULT nextval('public.shopify_item_tracking_id_seq'::regclass);


--
-- TOC entry 3239 (class 2604 OID 573666)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 3486 (class 0 OID 32839)
-- Dependencies: 227
-- Data for Name: instrument_inventory; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.instrument_inventory (id, serial_number, instrument_type, tuning_type, color, date_produced, status, location, craftsperson, notes, price, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 3488 (class 0 OID 32853)
-- Dependencies: 229
-- Data for Name: material_mapping_rules; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.material_mapping_rules (id, name, instrument_type, instrument_size, tuning_note, bag_type, bag_size, box_size, priority, is_active, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 3484 (class 0 OID 32825)
-- Dependencies: 225
-- Data for Name: materials_inventory; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.materials_inventory (id, material_name, material_type, bag_type, size, quantity, reorder_point, ordered, expected_delivery, order_date, order_reference, display_order, last_updated, notes) FROM stdin;
\.


--
-- TOC entry 3490 (class 0 OID 32866)
-- Dependencies: 231
-- Data for Name: mold_inventory; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.mold_inventory (id, name, size, instrument_type, is_active, notes, last_used, created_at, updated_at) FROM stdin;
1	12 17 18		INNATO	t		\N	2025-04-25 05:22:44.747005	2025-04-25 05:22:44.747005
2	13 18 20.5		INNATO	t		\N	2025-04-25 05:24:30.697497	2025-04-25 05:24:30.697497
3	14 19 22		INNATO	t		\N	2025-04-25 05:46:21.551618	2025-04-25 05:46:21.551618
4	15 19 23 sm		INNATO	t		\N	2025-04-25 05:46:57.382105	2025-04-25 05:46:57.382105
5	16 20.5 24		INNATO	t		\N	2025-04-25 05:47:25.038387	2025-04-25 05:47:25.038387
6	17 21.5 25		INNATO	t		\N	2025-04-25 05:47:44.412136	2025-04-25 05:47:44.412136
7	17 22 26		INNATO	t		\N	2025-04-25 05:48:04.53679	2025-04-25 05:48:04.53679
8	18 24 28		INNATO	t		\N	2025-04-25 05:48:25.819818	2025-04-25 05:48:25.819818
9	19 26 30		INNATO	t		\N	2025-04-25 05:49:16.302203	2025-04-25 05:49:16.302203
10	20 28 32		INNATO	t		\N	2025-04-25 07:06:48.363744	2025-04-25 07:06:48.363744
11	19 26 30		INNATO	t		\N	2025-04-25 07:25:54.133042	2025-04-25 07:25:54.133042
12	14		NATEY	t		\N	2025-04-25 13:08:54.92182	2025-04-25 13:08:54.92182
13	15		NATEY	t		\N	2025-04-26 13:43:23.550383	2025-04-26 13:43:23.550383
14	16		NATEY	t		\N	2025-04-26 13:43:58.709261	2025-04-26 13:43:58.709261
15	17		NATEY	t		\N	2025-04-26 13:44:42.178597	2025-04-26 13:44:42.178597
16	18		NATEY	t		\N	2025-04-26 13:45:31.321502	2025-04-26 13:45:31.321502
17	19		NATEY	t		\N	2025-04-26 13:47:26.658499	2025-04-26 13:47:26.658499
18	20.5		NATEY	t		\N	2025-04-26 13:48:05.475203	2025-04-26 13:48:05.475203
19	22		NATEY	t		\N	2025-04-26 13:50:20.116032	2025-04-26 13:50:20.116032
20	23		NATEY	t		\N	2025-04-26 13:51:11.145479	2025-04-26 13:51:11.145479
21	24		NATEY	t		\N	2025-04-26 13:51:39.006836	2025-04-26 13:51:39.006836
22	25		NATEY	t		\N	2025-04-26 13:52:04.381728	2025-04-26 13:52:04.381728
23	ZEN L		ZEN	t		\N	2025-04-26 13:52:34.096682	2025-04-26 13:52:34.096682
24	ZEN M		ZEN	t		\N	2025-04-26 13:52:54.538176	2025-04-26 13:52:54.538176
25	DOUBLE M		DOUBLE	t		\N	2025-04-26 13:53:14.239756	2025-04-26 13:53:14.239756
26	DOUBLE L		DOUBLE	t		\N	2025-04-26 14:30:12.806515	2025-04-26 14:30:12.806515
27	OvA64Hz		OvA	t		\N	2025-04-26 14:31:48.968398	2025-04-26 14:31:48.968398
\.


--
-- TOC entry 3494 (class 0 OID 32891)
-- Dependencies: 235
-- Data for Name: mold_mapping_items; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.mold_mapping_items (id, mapping_id, mold_id, order_index, created_at) FROM stdin;
2	1	2	0	2025-04-25 05:25:16.345504
3	3	2	0	2025-04-25 05:27:46.533888
4	3	1	0	2025-04-25 05:27:46.614304
5	4	3	0	2025-04-25 05:46:36.57473
6	5	4	0	2025-04-25 05:47:09.650622
8	7	6	0	2025-04-25 05:47:54.399489
9	8	7	0	2025-04-25 05:48:13.244385
10	9	8	0	2025-04-25 05:48:34.479975
11	10	7	0	2025-04-25 05:48:50.322046
12	10	8	0	2025-04-25 05:48:51.824498
15	15	12	0	2025-04-26 13:43:06.571409
17	17	14	0	2025-04-26 13:44:11.721568
19	18	14	0	2025-04-26 13:44:30.913128
20	19	15	0	2025-04-26 13:45:00.330736
21	20	14	0	2025-04-26 13:45:14.547428
22	20	15	0	2025-04-26 13:45:15.884115
23	21	16	0	2025-04-26 13:47:13.596775
26	23	17	0	2025-04-26 13:47:52.29618
27	25	19	0	2025-04-26 13:50:43.444556
28	26	18	0	2025-04-26 13:50:59.224416
29	26	19	0	2025-04-26 13:51:00.64954
30	27	20	0	2025-04-26 13:51:27.160323
31	28	21	0	2025-04-26 13:51:56.406487
32	29	23	0	2025-04-26 13:52:47.381452
37	32	24	0	2025-04-26 13:54:54.843118
38	33	25	0	2025-04-26 13:55:21.558499
39	34	24	0	2025-04-26 13:55:37.474568
40	34	25	0	2025-04-26 13:55:39.691026
42	35	25	0	2025-04-26 13:56:15.717025
43	36	26	0	2025-04-26 14:30:29.418617
45	37	26	0	2025-04-26 14:30:46.910525
47	38	26	0	2025-04-26 14:31:12.118388
49	39	26	0	2025-04-26 14:31:30.576009
50	40	27	0	2025-04-26 14:31:59.88412
51	13	9	0	2025-04-28 18:24:57.392293
52	6	5	0	2025-04-28 18:35:00.943681
53	14	12	0	2025-04-28 20:36:06.887658
\.


--
-- TOC entry 3492 (class 0 OID 32879)
-- Dependencies: 233
-- Data for Name: mold_mappings; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.mold_mappings (id, name, instrument_type, tuning_note, is_active, created_at, updated_at) FROM stdin;
1	INNATO E4	INNATO	E4	t	2025-04-25 05:23:09.531297	2025-04-25 05:23:09.531297
2	INNATO D#4	INNATO	D#4	t	2025-04-25 05:24:35.344937	2025-04-25 05:24:35.344937
3	INNATO D4	INNATO	D4	t	2025-04-25 05:27:27.582484	2025-04-25 05:27:27.582484
4	INNATO C#4	INNATO	C#4	t	2025-04-25 05:46:30.238652	2025-04-25 05:46:30.238652
5	INNATO C4	INNATO	C4	t	2025-04-25 05:47:05.868586	2025-04-25 05:47:05.868586
6	INNATO B3	INNATO	B3	t	2025-04-25 05:47:29.220564	2025-04-25 05:47:29.220564
7	INNATO Bb3	INNATO	Bb3	t	2025-04-25 05:47:48.767326	2025-04-25 05:47:48.767326
8	INNATO A3	INNATO	A3	t	2025-04-25 05:48:08.318591	2025-04-25 05:48:08.318591
9	INNATO G#3	INNATO	G#3	t	2025-04-25 05:48:30.337552	2025-04-25 05:48:30.337552
10	INNATO G3	INNATO	G3	t	2025-04-25 05:48:45.529774	2025-04-25 05:48:45.529774
11	INNATO F#3	INNATO	F#3	t	2025-04-25 05:49:24.352176	2025-04-25 05:49:24.352176
12	E3	INNATO	E3	t	2025-04-25 07:20:06.793082	2025-04-25 07:20:06.793082
13	INNATO F3	INNATO	F3	t	2025-04-25 07:26:02.238089	2025-04-25 07:26:02.238089
14	NATEY A4	NATEY	A4	t	2025-04-25 13:09:05.973513	2025-04-25 13:09:05.973513
15	NATEY G#4	NATEY	G#4	t	2025-04-26 13:43:01.18501	2025-04-26 13:43:01.18501
16	NATEY G4	NATEY	G4	t	2025-04-26 13:43:32.219355	2025-04-26 13:43:32.219355
17	NATEY F#4	NATEY	F#4	t	2025-04-26 13:44:07.481762	2025-04-26 13:44:07.481762
18	NATEY F4	NATEY	F4	t	2025-04-26 13:44:24.703667	2025-04-26 13:44:24.703667
19	NATEY E4	NATEY	E4	t	2025-04-26 13:44:53.779	2025-04-26 13:44:53.779
20	NATEY D#4	NATEY	D#4	t	2025-04-26 13:45:10.171883	2025-04-26 13:45:10.171883
21	NATEY D4	NATEY	D4	t	2025-04-26 13:45:37.118124	2025-04-26 13:45:37.118124
22	NATEY C#4	NATEY	C#4	t	2025-04-26 13:47:34.697354	2025-04-26 13:47:34.697354
23	NATEY C4	NATEY	C4	t	2025-04-26 13:47:46.92749	2025-04-26 13:47:46.92749
24	NATEY B3	NATEY	B3	t	2025-04-26 13:48:14.801455	2025-04-26 13:48:14.801455
25	NATEY Bb3	NATEY	Bb3	t	2025-04-26 13:50:35.958536	2025-04-26 13:50:35.958536
26	NATEY A3	NATEY	A3	t	2025-04-26 13:50:52.674355	2025-04-26 13:50:52.674355
27	NATEY G#3	NATEY	G#3	t	2025-04-26 13:51:20.341441	2025-04-26 13:51:20.341441
28	NATEY G3	NATEY	G3	t	2025-04-26 13:51:51.463426	2025-04-26 13:51:51.463426
29	ZEN L	ZEN	L	t	2025-04-26 13:52:41.99675	2025-04-26 13:52:41.99675
32	ZEN M	ZEN	M	t	2025-04-26 13:54:47.434674	2025-04-26 13:54:47.434674
33	DOUBLE C#4	DOUBLE	C#4	t	2025-04-26 13:55:10.998362	2025-04-26 13:55:10.998362
34	DOUBLE C4	DOUBLE	C4	t	2025-04-26 13:55:32.883702	2025-04-26 13:55:32.883702
35	DOUBLE B3	DOUBLE	B3	t	2025-04-26 13:55:50.886451	2025-04-26 13:55:50.886451
36	DOUBLE Bb3	DOUBLE	Bb3	t	2025-04-26 14:30:20.969824	2025-04-26 14:30:20.969824
37	DOUBLE A3	DOUBLE	A3	t	2025-04-26 14:30:39.024461	2025-04-26 14:30:39.024461
38	DOUBLE G#3	DOUBLE	G#3	t	2025-04-26 14:30:57.429033	2025-04-26 14:30:57.429033
39	DOUBLE G3	DOUBLE	G3	t	2025-04-26 14:31:23.794654	2025-04-26 14:31:23.794654
40	OvA 64 Hz	OvA	64 Hz	t	2025-04-26 14:31:55.438807	2025-04-26 14:31:55.438807
\.


--
-- TOC entry 3480 (class 0 OID 32799)
-- Dependencies: 221
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.order_items (id, order_id, serial_number, item_type, item_size, tuning_type, color, weight, craftsperson, order_number, order_date, deadline, build_date, bag_size, box_size, specifications, status, progress, status_change_dates, created_at, updated_at, is_archived, archived_reason) FROM stdin;
566	50	SW-1542-51	Innato Dm4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Innato Dm4", "color": "Smokefired Blue with Red and Bronze Bubbles", "model": "INNATO", "fulfillable_quantity": "2"}	ordered	0	{}	2025-04-29 11:13:59.077988	2025-04-29 19:11:38.634	f	\N
567	50	SW-1542-52	Innato Dm4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Innato Dm4", "color": "Smokefired Terra with Terra and bronze Bubbles", "model": "INNATO", "fulfillable_quantity": "2"}	ordered	0	{}	2025-04-29 11:13:59.196767	2025-04-29 19:11:38.754	f	\N
568	50	SW-1542-53	Innato Em4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "432 Hz", "type": "Innato Em4", "color": "Smokefired Blue with Red and Bronze Bubbles", "model": "INNATO", "fulfillable_quantity": "0"}	ordered	0	{}	2025-04-29 11:13:59.315749	2025-04-29 19:11:38.874	f	\N
570	50	SW-1542-55	Innato Cm4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Innato Cm4", "color": "Smokefired Terra with Terra and bronze Bubbles", "model": "INNATO", "fulfillable_quantity": "2"}	ordered	0	{}	2025-04-29 11:13:59.551935	2025-04-29 19:11:39.113	f	\N
3485	58	SW-1535-1	Innato Exploration Cards	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"type": "Innato Exploration Cards", "model": "INNATO", "fulfillable_quantity": "1"}	ordered	0	{}	2025-04-29 09:34:37.436721	2025-04-29 12:33:31.347	f	\N
1332	50	SW-1542-17	Natey Am3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "432 Hz", "type": "Natey Am3", "color": "Smokefired Terra with Terra and bronze Bubbles", "model": "NATEY", "fulfillable_quantity": "1"}	ordered	0	{}	2025-04-29 09:02:19.48947	2025-04-29 19:11:34.912	f	\N
2429	243	SW-1350-1	Innato flute	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "C# - small/ medium hands", "type": "Innato flute", "color": "Smokefired black/ Red and Copper Bubbles", "model": "INNATO"}	ordered	0	{}	2025-04-29 09:19:56.701071	2025-04-29 09:19:56.701071	f	\N
1826	37	SW-1555-6	Innato Cm4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Innato Cm4", "color": "Smokefired Blue with Red and Bronze Bubbles", "model": "INNATO"}	archived	0	{}	2025-04-29 09:13:22.56778	2025-04-29 11:19:08.545	t	Automatically marked as archived during Shopify sync
572	50	SW-1542-57	Innato Cm4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Innato Cm4", "color": "Smokefired Terra and Black", "model": "INNATO", "fulfillable_quantity": "3"}	ordered	0	{}	2025-04-29 11:13:59.788409	2025-04-29 19:11:39.361	f	\N
4074	35	SW-1557-1	Innato Am3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Innato Am3", "color": "Smokefired Terra with Terra and bronze Bubbles", "model": "INNATO", "fulfillable_quantity": "1"}	ordered	0	{}	2025-04-29 09:43:07.327309	2025-04-29 19:11:23.389	f	\N
573	50	SW-1542-58	Innato Bm3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Innato Bm3", "color": "Blue, with Terra and Gold Bubbles", "model": "INNATO", "fulfillable_quantity": "2"}	ordered	0	{}	2025-04-29 11:13:59.906151	2025-04-29 19:11:39.481	f	\N
575	50	SW-1542-60	Innato Am3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "432 Hz", "type": "Innato Am3", "color": "Smokefired black with Terra and Copper Bubbles", "model": "INNATO", "fulfillable_quantity": "2"}	ordered	0	{}	2025-04-29 11:14:00.150004	2025-04-29 19:11:39.723	f	\N
577	50	SW-1542-62	Innato Am3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Innato Am3", "color": "Smokefired black with Terra and Copper Bubbles", "model": "INNATO", "fulfillable_quantity": "3"}	ordered	0	{}	2025-04-29 11:14:00.389625	2025-04-29 19:11:39.966	f	\N
578	50	SW-1542-63	Innato Gm3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Innato Gm3", "color": "Smokefired Blue with Red and Bronze Bubbles", "model": "INNATO", "fulfillable_quantity": "2"}	ordered	0	{}	2025-04-29 11:14:00.507322	2025-04-29 19:11:40.091	f	\N
579	50	SW-1542-64	Innato Gm3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Innato Gm3", "color": "Smokefired Terra with Terra and bronze Bubbles", "model": "INNATO", "fulfillable_quantity": "2"}	ordered	0	{}	2025-04-29 11:14:00.62629	2025-04-29 19:11:40.221	f	\N
582	37	SW-1555-16	Innato F#m3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "432 Hz", "type": "Innato F#m3", "color": "Smokefired black with Terra and Copper Bubbles", "model": "INNATO", "fulfillable_quantity": "2"}	ordered	0	{}	2025-04-29 11:19:10.233548	2025-04-29 19:11:25.448	f	\N
1318	50	SW-1542-1	Innato Dm4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Innato Dm4", "color": "Smokefired Blue with Red and Bronze Bubbles", "model": "INNATO", "fulfillable_quantity": "2"}	ordered	0	{}	2025-04-29 09:02:18.661299	2025-04-29 19:11:32.951	f	\N
1323	50	SW-1542-7	Innato Bm3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Innato Bm3", "color": "Blue, with Terra and Gold Bubbles", "model": "INNATO", "fulfillable_quantity": "2"}	ordered	0	{}	2025-04-29 09:02:18.952561	2025-04-29 19:11:33.675	f	\N
1327	50	SW-1542-11	Innato Gm3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Innato Gm3", "color": "Smokefired Blue with Red and Bronze Bubbles", "model": "INNATO", "fulfillable_quantity": "2"}	ordered	0	{}	2025-04-29 09:02:19.191661	2025-04-29 19:11:34.167	f	\N
1335	50	SW-1542-20	Natey Bm3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Natey Bm3", "color": "Blue, with Terra and Gold Bubbles", "model": "NATEY", "fulfillable_quantity": "1"}	ordered	0	{}	2025-04-29 09:02:19.664356	2025-04-29 19:11:35.273	f	\N
569	50	SW-1542-54	Innato Cm4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Innato Cm4", "color": "Blue, with Terra and Gold Bubbles", "model": "INNATO", "fulfillable_quantity": "2"}	ordered	0	{}	2025-04-29 11:13:59.434237	2025-04-29 19:11:38.992	f	\N
571	50	SW-1542-56	Innato Cm4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Innato Cm4", "color": "Smokefired Terra and Black", "model": "INNATO", "fulfillable_quantity": "3"}	ordered	0	{}	2025-04-29 11:13:59.670087	2025-04-29 19:11:39.233	f	\N
3513	75	SW-1518-1	Double Large Native Am3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "432 Hz", "type": "Double Large Native Am3", "color": "Blue, with Terra and Gold Bubbles", "model": "DOUBLE"}	archived	0	{}	2025-04-29 09:34:46.689523	2025-04-29 12:33:34.361	t	Automatically marked as archived during Shopify sync
3488	65	SW-1528-1	ZEN flute Large	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"type": "ZEN flute Large", "color": "Blue, with Terra and Gold Bubbles", "model": "ZEN", "fulfillable_quantity": "1"}	ordered	0	{}	2025-04-29 09:34:41.2712	2025-04-29 12:33:32.673	f	\N
3493	68	SW-1525-1	ZEN flute Medium	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"type": "ZEN flute Medium", "color": "Smokefired Terra and Black", "model": "ZEN", "fulfillable_quantity": "1"}	ordered	0	{}	2025-04-29 09:34:43.021812	2025-04-29 12:33:33.874	f	\N
3521	78	SW-1515-1	Double Medium Native Bbm3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Double Medium Native Bbm3", "color": "Smokefired Blue with Red and Bronze Bubbles", "model": "DOUBLE"}	archived	0	{}	2025-04-29 09:34:48.291549	2025-04-29 12:33:34.836	t	Automatically marked as archived during Shopify sync
3553	88	SW-1505-1	Innato Exploration Cards	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"type": "Innato Exploration Cards", "model": "INNATO", "fulfillable_quantity": "1"}	ordered	0	{}	2025-04-29 09:34:53.530386	2025-04-29 12:33:35.442	f	\N
574	50	SW-1542-59	Innato Bm3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Innato Bm3", "color": "Smokefired black with Terra and Copper Bubbles", "model": "INNATO", "fulfillable_quantity": "2"}	ordered	0	{}	2025-04-29 11:14:00.029103	2025-04-29 19:11:39.602	f	\N
576	50	SW-1542-61	Innato Am3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Innato Am3", "color": "Smokefired black with Terra and Copper Bubbles", "model": "INNATO", "fulfillable_quantity": "3"}	ordered	0	{}	2025-04-29 11:14:00.269758	2025-04-29 19:11:39.846	f	\N
1328	50	SW-1542-12	Innato Gm3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Innato Gm3", "color": "Smokefired Terra with Terra and bronze Bubbles", "model": "INNATO", "fulfillable_quantity": "2"}	ordered	0	{}	2025-04-29 09:02:19.250911	2025-04-29 19:11:34.292	f	\N
1333	50	SW-1542-18	Natey Am3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Natey Am3", "color": "Smokefired black with Terra and Copper Bubbles", "model": "NATEY", "fulfillable_quantity": "1"}	ordered	0	{}	2025-04-29 09:02:19.547583	2025-04-29 19:11:35.034	f	\N
1336	50	SW-1542-28	Natey Em3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Natey Em3", "color": "Smokefired Blue with Red and Bronze Bubbles", "model": "NATEY", "fulfillable_quantity": "1"}	ordered	0	{}	2025-04-29 09:02:19.724451	2025-04-29 19:11:36.244	f	\N
580	50	SW-1542-65	Innato Em4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Innato Em4", "color": "Smokefired Blue with Red and Bronze Bubbles", "model": "INNATO", "fulfillable_quantity": "2"}	ordered	0	{}	2025-04-29 11:14:00.743742	2025-04-29 19:11:40.344	f	\N
3487	63	SW-1530-2	Double Medium Native Bm3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Double Medium Native Bm3", "color": "Smokefired Terra with Terra and bronze Bubbles", "model": "DOUBLE", "fulfillable_quantity": "1"}	ordered	0	{}	2025-04-29 09:34:40.152275	2025-04-29 12:33:32.072	f	\N
3491	67	SW-1526-1	Innato Am3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Innato Am3", "color": "Smokefired Terra with Terra and bronze Bubbles", "model": "INNATO", "fulfillable_quantity": "1"}	ordered	0	{}	2025-04-29 09:34:42.418238	2025-04-29 12:33:33.272	f	\N
1337	50	SW-1542-29	Natey Em3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Natey Em3", "color": "Smokefired black with Terra and Copper Bubbles", "model": "NATEY", "fulfillable_quantity": "1"}	ordered	0	{}	2025-04-29 09:02:19.783266	2025-04-29 19:11:36.365	f	\N
1338	50	SW-1542-30	Natey F#m3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Natey F#m3", "color": "Smokefired Blue with Red and Bronze Bubbles", "model": "NATEY", "fulfillable_quantity": "1"}	ordered	0	{}	2025-04-29 09:02:19.854262	2025-04-29 19:11:36.485	f	\N
1339	50	SW-1542-31	Natey F#m4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Natey F#m4", "color": "Blue, with Terra and Gold Bubbles", "model": "NATEY", "fulfillable_quantity": "1"}	ordered	0	{}	2025-04-29 09:02:19.915866	2025-04-29 19:11:36.605	f	\N
1344	50	SW-1542-37	Natey G#m3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Natey G#m3", "color": "Blue, with Terra and Gold Bubbles", "model": "NATEY", "fulfillable_quantity": "1"}	ordered	0	{}	2025-04-29 09:02:20.211101	2025-04-29 19:11:37.155	f	\N
1345	50	SW-1542-38	Natey G#m3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Natey G#m3", "color": "Smokefired Blue with Red and Bronze Bubbles", "model": "NATEY", "fulfillable_quantity": "1"}	ordered	0	{}	2025-04-29 09:02:20.277553	2025-04-29 19:11:37.278	f	\N
1346	50	SW-1542-39	Natey G#m3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "432 Hz", "type": "Natey G#m3", "color": "Smokefired Blue with Red and Bronze Bubbles", "model": "NATEY", "fulfillable_quantity": "1"}	ordered	0	{}	2025-04-29 09:02:20.340266	2025-04-29 19:11:37.397	f	\N
1347	50	SW-1542-40	Natey G#m3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Natey G#m3", "color": "Smokefired black with Terra and Copper Bubbles", "model": "NATEY", "fulfillable_quantity": "1"}	ordered	0	{}	2025-04-29 09:02:20.402065	2025-04-29 19:11:37.523	f	\N
1348	50	SW-1542-41	Natey G#m3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "432 Hz", "type": "Natey G#m3", "color": "Smokefired black with Terra and Copper Bubbles", "model": "NATEY", "fulfillable_quantity": "1"}	ordered	0	{}	2025-04-29 09:02:20.461327	2025-04-29 19:11:37.65	f	\N
1343	50	SW-1542-36	Natey Fm4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Natey Fm4", "color": "Smokefired black with Terra and Copper Bubbles", "model": "NATEY", "fulfillable_quantity": "1"}	archived	0	{}	2025-04-29 09:02:20.151676	2025-04-29 12:46:55.577	t	Verwijderd uit Shopify - handmatig gearchiveerd
1351	50	SW-1542-46	Natey Gm4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Natey Gm4", "color": "Smokefired Terra with Terra and bronze Bubbles", "model": "NATEY", "fulfillable_quantity": "1"}	archived	0	{}	2025-04-29 09:02:20.640386	2025-04-29 12:46:56.647	t	Verwijderd uit Shopify - handmatig gearchiveerd
1823	37	SW-1555-3	Innato Am3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "432 Hz", "type": "Innato Am3", "color": "Smokefired Blue with Red and Bronze Bubbles", "model": "INNATO"}	archived	0	{}	2025-04-29 09:13:22.203904	2025-04-29 11:24:36.32	t	Automatically marked as archived during Shopify sync
4073	34	SW-1558-1	Innato Cm4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "432 Hz", "type": "Innato Cm4", "color": "Smokefired Blue with Red and Bronze Bubbles", "model": "INNATO", "fulfillable_quantity": "1"}	ordered	0	{}	2025-04-29 09:43:06.730011	2025-04-29 19:11:22.78	f	\N
1319	50	SW-1542-2	Innato Dm4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Innato Dm4", "color": "Smokefired Terra with Terra and bronze Bubbles", "model": "INNATO", "fulfillable_quantity": "2"}	ordered	0	{}	2025-04-29 09:02:18.719444	2025-04-29 19:11:33.07	f	\N
1326	50	SW-1542-10	Innato Am3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Innato Am3", "color": "Smokefired black with Terra and Copper Bubbles", "model": "INNATO", "fulfillable_quantity": "3"}	ordered	0	{}	2025-04-29 09:02:19.13352	2025-04-29 19:11:34.047	f	\N
1329	50	SW-1542-13	Innato G#m3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Innato G#m3", "color": "Blue, with Terra and Gold Bubbles", "model": "INNATO", "fulfillable_quantity": "1"}	ordered	0	{}	2025-04-29 09:02:19.309013	2025-04-29 19:11:34.413	f	\N
1330	50	SW-1542-15	Natey Am3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "432 Hz", "type": "Natey Am3", "color": "Smokefired Blue with Red and Bronze Bubbles", "model": "NATEY", "fulfillable_quantity": "1"}	ordered	0	{}	2025-04-29 09:02:19.36975	2025-04-29 19:11:34.657	f	\N
1331	50	SW-1542-16	Natey Am3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Natey Am3", "color": "Smokefired Terra with Terra and bronze Bubbles", "model": "NATEY", "fulfillable_quantity": "1"}	ordered	0	{}	2025-04-29 09:02:19.429022	2025-04-29 19:11:34.776	f	\N
1334	50	SW-1542-19	Natey Am3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "432 Hz", "type": "Natey Am3", "color": "Smokefired black with Terra and Copper Bubbles", "model": "NATEY", "fulfillable_quantity": "1"}	ordered	0	{}	2025-04-29 09:02:19.606086	2025-04-29 19:11:35.153	f	\N
1349	50	SW-1542-42	Natey Gm3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Natey Gm3", "color": "Smokefired Blue with Red and Bronze Bubbles", "model": "NATEY", "fulfillable_quantity": "1"}	ordered	0	{}	2025-04-29 09:02:20.520008	2025-04-29 19:11:37.772	f	\N
1350	50	SW-1542-43	Natey Gm3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Natey Gm3", "color": "Smokefired black with Terra and Copper Bubbles", "model": "NATEY", "fulfillable_quantity": "1"}	ordered	0	{}	2025-04-29 09:02:20.578265	2025-04-29 19:11:37.893	f	\N
1352	50	SW-1542-48	Innato Em4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Innato Em4", "color": "Smokefired Blue with Red and Bronze Bubbles", "model": "INNATO", "fulfillable_quantity": "2"}	ordered	0	{}	2025-04-29 09:02:20.702048	2025-04-29 19:11:38.262	f	\N
1895	50	SW-1542-47	Natey Gm4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Natey Gm4", "color": "Smokefired black with Terra and Copper Bubbles", "model": "NATEY", "fulfillable_quantity": "0"}	archived	0	{}	2025-04-29 09:13:40.435863	2025-04-29 12:35:36.221	t	Item niet meer aanwezig in Shopify order - specifieke fix voor order 1542
586	33	SW-1559-4	Innato G#m3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Innato G#m3", "color": "Smokefired Blue with Red and Bronze Bubbles", "model": "INNATO", "fulfillable_quantity": "0"}	archived	0	{}	2025-04-29 18:59:25.274024	2025-04-29 19:00:39.998	t	Automatically marked as archived during Shopify sync
587	37	SW-1555-9	Innato Em3 (NEW)	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "432 Hz", "type": "Innato Em3 (NEW)", "color": "Smokefired black with Terra and Copper Bubbles", "model": "INNATO", "fulfillable_quantity": "0"}	archived	0	{}	2025-04-29 18:59:27.797799	2025-04-29 19:00:42.029	t	Automatically marked as archived during Shopify sync
585	33	SW-1559-3	Innato Em3 (NEW)	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Innato Em3 (NEW)", "color": "Blue, with Terra and Gold Bubbles", "model": "INNATO", "fulfillable_quantity": "0"}	archived	0	{}	2025-04-29 18:59:25.138367	2025-04-29 19:01:16.548	t	Automatically marked as archived during Shopify sync
583	32	SW-1560-1	Innato Am3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Innato Am3", "color": "Blue, with Terra and Gold Bubbles", "model": "INNATO", "fulfillable_quantity": "0"}	ordered	0	{}	2025-04-29 18:59:24.050835	2025-04-29 19:11:21.096	f	\N
3616	136	SW-1457-2	Natey Gm3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Natey Gm3", "color": "Smokefired Terra with Terra and bronze Bubbles", "model": "NATEY", "fulfillable_quantity": "1"}	ordered	0	{}	2025-04-29 09:35:19.251005	2025-04-29 12:33:36.037	f	\N
1824	37	SW-1555-4	Innato Cm4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Innato Cm4", "color": "Blue, with Terra and Gold Bubbles", "model": "INNATO"}	archived	0	{}	2025-04-29 09:13:22.264474	2025-04-29 11:23:42.837	t	Automatically marked as archived during Shopify sync
584	32	SW-1560-2	Innato Am3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Innato Am3", "color": "Smokefired Blue with Red and Bronze Bubbles", "model": "INNATO", "fulfillable_quantity": "0"}	ordered	0	{}	2025-04-29 18:59:24.171544	2025-04-29 19:11:21.217	f	\N
588	37	SW-1555-11	Innato Fm3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Innato Fm3", "color": "Smokefired Blue with Red and Bronze Bubbles", "model": "INNATO", "fulfillable_quantity": "0"}	ordered	0	{}	2025-04-29 18:59:28.178533	2025-04-29 19:11:24.841	f	\N
589	37	SW-1555-12	Innato Gm3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "432 Hz", "type": "Innato Gm3", "color": "Smokefired Blue with Red and Bronze Bubbles", "model": "INNATO", "fulfillable_quantity": "0"}	ordered	0	{}	2025-04-29 18:59:28.299028	2025-04-29 19:11:24.962	f	\N
590	50	SW-1542-23	Natey Cm4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Natey Cm4", "color": "Blue, with Terra and Gold Bubbles", "model": "NATEY", "fulfillable_quantity": "0"}	ordered	0	{}	2025-04-29 18:59:38.899134	2025-04-29 19:11:35.641	f	\N
591	50	SW-1542-24	Natey Cm4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Natey Cm4", "color": "Smokefired Blue with Red and Bronze Bubbles", "model": "NATEY", "fulfillable_quantity": "0"}	ordered	0	{}	2025-04-29 18:59:39.021032	2025-04-29 19:11:35.76	f	\N
592	50	SW-1542-25	Natey Cm4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Natey Cm4", "color": "Smokefired Terra with Terra and bronze Bubbles", "model": "NATEY", "fulfillable_quantity": "0"}	ordered	0	{}	2025-04-29 18:59:39.141011	2025-04-29 19:11:35.88	f	\N
593	50	SW-1542-26	Natey Dm4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Natey Dm4", "color": "Smokefired Blue with Red and Bronze Bubbles", "model": "NATEY", "fulfillable_quantity": "0"}	ordered	0	{}	2025-04-29 18:59:39.260705	2025-04-29 19:11:36.004	f	\N
594	50	SW-1542-27	Natey Dm4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Natey Dm4", "color": "Smokefired black with Terra and Copper Bubbles", "model": "NATEY", "fulfillable_quantity": "0"}	ordered	0	{}	2025-04-29 18:59:39.381452	2025-04-29 19:11:36.124	f	\N
595	50	SW-1542-49	Natey Am4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Natey Am4", "color": "Smokefired Blue with Red and Bronze Bubbles", "model": "NATEY", "fulfillable_quantity": "0"}	ordered	0	{}	2025-04-29 18:59:41.602868	2025-04-29 19:11:38.385	f	\N
596	50	SW-1542-50	Natey Am4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Natey Am4", "color": "Smokefired black with Terra and Copper Bubbles", "model": "NATEY", "fulfillable_quantity": "0"}	ordered	0	{}	2025-04-29 18:59:41.723059	2025-04-29 19:11:38.512	f	\N
597	50	SW-1542-66	Natey Am4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Natey Am4", "color": "Smokefired black with Terra and Copper Bubbles", "model": "NATEY", "fulfillable_quantity": "0"}	ordered	0	{}	2025-04-29 18:59:43.648633	2025-04-29 19:11:40.463	f	\N
4113	50	SW-1542-9	Innato Am3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "432 Hz", "type": "Innato Am3", "color": "Smokefired black with Terra and Copper Bubbles", "model": "INNATO", "fulfillable_quantity": "2"}	ordered	0	{}	2025-04-29 09:43:21.411084	2025-04-29 19:11:33.925	f	\N
2448	252	SW-1094-9	Innato flute	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "G - large hands", "type": "Innato flute", "color": "Artist Choice", "model": "INNATO"}	ordered	0	{}	2025-04-29 09:20:02.769657	2025-04-29 09:20:02.769657	f	\N
442	252	SW-1094-1	Natey flute	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "Red with Gold Bubble Smokefired", "type": "Natey flute", "color": "A4", "model": "NATEY"}	ordered	0	{}	2025-04-24 22:20:23.100477	2025-04-24 22:20:23.100477	f	\N
443	252	SW-1094-2	Natey flute	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "Blue with Red/Gold Bubbles", "type": "Natey flute", "color": "A4", "model": "NATEY"}	ordered	0	{}	2025-04-24 22:20:23.15991	2025-04-24 22:20:23.15991	f	\N
444	252	SW-1094-3	Natey flute	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "Red with Gold Bubble Smokefired", "type": "Natey flute", "color": "F#4", "model": "NATEY"}	ordered	0	{}	2025-04-24 22:20:23.223599	2025-04-24 22:20:23.223599	f	\N
445	252	SW-1094-4	Natey flute	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "Blue with Red/Gold Bubbles", "type": "Natey flute", "color": "F4", "model": "NATEY"}	ordered	0	{}	2025-04-24 22:20:23.283606	2025-04-24 22:20:23.283606	f	\N
446	252	SW-1094-5	Natey flute	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "Blue with Red/Gold Bubbles Smokefired", "type": "Natey flute", "color": "E4", "model": "NATEY"}	ordered	0	{}	2025-04-24 22:20:23.342022	2025-04-24 22:20:23.342022	f	\N
447	252	SW-1094-6	Innato flute	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "B - medium hands", "type": "Innato flute", "color": "Artist Choice", "model": "INNATO"}	ordered	0	{}	2025-04-24 22:20:23.402444	2025-04-24 22:20:23.402444	f	\N
448	252	SW-1094-7	Innato flute	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "A - medium/ large hands", "type": "Innato flute", "color": "Artist Choice", "model": "INNATO"}	ordered	0	{}	2025-04-24 22:20:23.462092	2025-04-24 22:20:23.462092	f	\N
449	252	SW-1094-8	Innato flute	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "C - medium hands", "type": "Innato flute", "color": "Artist Choice", "model": "INNATO"}	ordered	0	{}	2025-04-24 22:20:23.520584	2025-04-24 22:20:23.520584	f	\N
1883	50	SW-1542-35	Natey Fm4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Natey Fm4", "color": "Smokefired Terra with Terra and bronze Bubbles", "model": "NATEY", "fulfillable_quantity": "0"}	archived	0	{}	2025-04-29 09:13:38.086032	2025-04-29 12:35:35.981	t	Item niet meer aanwezig in Shopify order - specifieke fix voor order 1542
4033	6	SW-1586-1	ZEN flute Medium	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"type": "ZEN flute Medium", "color": "Smokefired Terra and Black", "model": "ZEN", "fulfillable_quantity": "1"}	ordered	0	{}	2025-04-29 09:42:49.255695	2025-04-29 20:21:07.609	f	\N
4036	7	SW-1585-1	Innato Dm4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Innato Dm4", "color": "Smokefired Blue with Red and Bronze Bubbles", "model": "INNATO", "fulfillable_quantity": "1"}	ordered	0	{}	2025-04-29 09:42:49.931992	2025-04-29 20:21:08.233	f	\N
4038	8	SW-1584-1	ZEN flute Medium	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"type": "ZEN flute Medium", "color": "Smokefired Terra and Black", "model": "ZEN", "fulfillable_quantity": "1"}	ordered	0	{}	2025-04-29 09:42:50.534381	2025-04-29 20:21:08.831	f	\N
4040	9	SW-1583-1	Innato Exploration Cards	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"type": "Innato Exploration Cards", "model": "INNATO", "fulfillable_quantity": "1"}	ordered	0	{}	2025-04-29 09:42:51.132936	2025-04-29 20:21:09.425	f	\N
4042	10	SW-1582-1	Natey Gm3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Natey Gm3", "color": "Blue, with Terra and Gold Bubbles", "model": "NATEY", "fulfillable_quantity": "1"}	ordered	0	{}	2025-04-29 09:42:51.782877	2025-04-29 20:21:10.014	f	\N
4044	11	SW-1581-1	Innato Bbm3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "432 Hz", "type": "Innato Bbm3", "color": "Blue, with Terra and Gold Bubbles", "model": "INNATO", "fulfillable_quantity": "1"}	ordered	0	{}	2025-04-29 09:42:52.406424	2025-04-29 20:21:10.602	f	\N
4064	31	SW-1561-1	Innato Bm3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Innato Bm3", "color": "Smokefired Blue with Red and Bronze Bubbles", "model": "INNATO", "fulfillable_quantity": "1"}	ordered	0	{}	2025-04-29 09:43:04.096603	2025-04-29 19:11:20.596	f	\N
4050	15	SW-1577-1	Innato Em4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Innato Em4", "color": "Smokefired Blue with Red and Bronze Bubbles", "model": "INNATO", "fulfillable_quantity": "1"}	ordered	0	{}	2025-04-29 09:42:54.871363	2025-04-29 20:21:13.129	f	\N
4058	25	SW-1567-1	Natey Am4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "432 Hz", "type": "Natey Am4", "color": "Blue, with Terra and Gold Bubbles", "model": "NATEY", "fulfillable_quantity": "1"}	ordered	0	{}	2025-04-29 09:43:00.531423	2025-04-29 19:11:17.588	f	\N
4053	18	SW-1574-1	Innato Bm3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "432 Hz", "type": "Innato Bm3", "color": "Blue, with Terra and Gold Bubbles", "model": "INNATO", "fulfillable_quantity": "1"}	ordered	0	{}	2025-04-29 09:42:56.565736	2025-04-29 19:11:14.352	f	\N
2614	33	SW-1559-2	Innato Am3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Innato Am3", "color": "Smokefired Blue with Red and Bronze Bubbles", "model": "INNATO", "fulfillable_quantity": "1"}	ordered	0	{}	2025-04-29 09:21:22.546264	2025-04-29 19:11:22.061	f	\N
4059	26	SW-1566-1	Natey Am3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "432 Hz", "type": "Natey Am3", "color": "Smokefired Terra with Terra and bronze Bubbles", "model": "NATEY", "fulfillable_quantity": "1"}	ordered	0	{}	2025-04-29 09:43:01.198532	2025-04-29 19:11:18.188	f	\N
4051	16	SW-1576-1	Natey Am4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Natey Am4", "color": "Smokefired Blue with Red and Bronze Bubbles", "model": "NATEY", "fulfillable_quantity": "1"}	ordered	0	{}	2025-04-29 09:42:55.47063	2025-04-29 20:21:13.729	f	\N
4060	27	SW-1565-1	Natey G#m4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Natey G#m4", "color": "Smokefired Blue with Red and Bronze Bubbles", "model": "NATEY", "fulfillable_quantity": "1"}	ordered	0	{}	2025-04-29 09:43:01.818218	2025-04-29 19:11:18.784	f	\N
4052	17	SW-1575-1	Natey Dm4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Natey Dm4", "color": "Smokefired Blue with Red and Bronze Bubbles", "model": "NATEY", "fulfillable_quantity": "1"}	ordered	0	{}	2025-04-29 09:42:56.079165	2025-04-29 20:21:14.331	f	\N
4047	12	SW-1580-2	Innato Fm3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Innato Fm3", "color": "Smokefired black with Terra and Copper Bubbles", "model": "INNATO", "fulfillable_quantity": "1"}	ordered	0	{}	2025-04-29 09:42:53.073129	2025-04-29 20:21:11.311	f	\N
4054	20	SW-1572-1	Natey Cm4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Natey Cm4", "color": "Smokefired Blue with Red and Bronze Bubbles", "model": "NATEY", "fulfillable_quantity": "1"}	ordered	0	{}	2025-04-29 09:42:57.728002	2025-04-29 19:11:15.434	f	\N
4055	21	SW-1571-1	Innato Dm4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Innato Dm4", "color": "Smokefired Blue with Red and Bronze Bubbles", "model": "INNATO", "fulfillable_quantity": "1"}	ordered	0	{}	2025-04-29 09:42:58.33013	2025-04-29 19:11:16.035	f	\N
4048	13	SW-1579-1	Innato Bbm3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Innato Bbm3", "color": "Smokefired Blue with Red and Bronze Bubbles", "model": "INNATO", "fulfillable_quantity": "1"}	ordered	0	{}	2025-04-29 09:42:53.6758	2025-04-29 20:21:11.918	f	\N
4061	28	SW-1564-1	Innato Em4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Innato Em4", "color": "Blue, with Terra and Gold Bubbles", "model": "INNATO", "fulfillable_quantity": "1"}	ordered	0	{}	2025-04-29 09:43:02.418255	2025-04-29 19:11:19.386	f	\N
4049	14	SW-1578-1	Innato C#m4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "432 Hz", "type": "Innato C#m4", "color": "Blue, with Terra and Gold Bubbles", "model": "INNATO", "fulfillable_quantity": "1"}	ordered	0	{}	2025-04-29 09:42:54.272631	2025-04-29 20:21:12.521	f	\N
4057	24	SW-1568-1	Innato Cm4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Innato Cm4", "color": "Smokefired Blue with Red and Bronze Bubbles", "model": "INNATO", "fulfillable_quantity": "1"}	ordered	0	{}	2025-04-29 09:42:59.908125	2025-04-29 19:11:16.992	f	\N
4062	29	SW-1563-1	Innato Cm4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Innato Cm4", "color": "Smokefired black with Terra and Copper Bubbles", "model": "INNATO", "fulfillable_quantity": "1"}	ordered	0	{}	2025-04-29 09:43:03.016601	2025-04-29 19:11:19.99	f	\N
1851	50	SW-1542-3	Innato Em4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "432 Hz", "type": "Innato Em4", "color": "Smokefired Blue with Red and Bronze Bubbles", "model": "INNATO", "fulfillable_quantity": "0"}	ordered	0	{}	2025-04-29 09:13:32.260728	2025-04-29 19:11:33.191	f	\N
4157	51	SW-1541-3	ZEN flute Large	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"type": "ZEN flute Large", "color": "Blue, with Terra and Gold Bubbles", "model": "ZEN", "fulfillable_quantity": "1"}	ordered	0	{}	2025-04-29 09:43:31.94123	2025-04-29 19:11:41.185	f	\N
4158	52	SW-1540-1	Innato Am3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "432 Hz", "type": "Innato Am3", "color": "Smokefired Blue with Red and Bronze Bubbles", "model": "INNATO", "fulfillable_quantity": "1"}	ordered	0	{}	2025-04-29 09:43:32.534093	2025-04-29 19:11:41.797	f	\N
4159	54	SW-1539-1	Innato Fm3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Innato Fm3", "color": "Blue, with Terra and Gold Bubbles", "model": "INNATO", "fulfillable_quantity": "1"}	ordered	0	{}	2025-04-29 09:43:33.125276	2025-04-29 19:11:42.402	f	\N
4160	55	SW-1538-1	Natey Em4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Natey Em4", "color": "Smokefired black with Terra and Copper Bubbles", "model": "NATEY", "fulfillable_quantity": "1"}	ordered	0	{}	2025-04-29 09:43:33.71591	2025-04-29 19:11:43.022	f	\N
4161	56	SW-1537-1	Innato Am3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Innato Am3", "color": "Blue, with Terra and Gold Bubbles", "model": "INNATO", "fulfillable_quantity": "1"}	ordered	0	{}	2025-04-29 09:43:34.300108	2025-04-29 19:11:43.63	f	\N
4223	19	SW-1573-1	Innato Em4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Innato Em4", "color": "Smokefired Terra and Black", "model": "INNATO"}	archived	0	{}	2025-04-29 09:53:16.907399	2025-04-29 10:52:07.59	t	Automatically marked as archived during Shopify sync
1288	32	SW-1560-3	Innato Em3 (NEW)	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Innato Em3 (NEW)", "color": "Blue, with Terra and Gold Bubbles", "model": "INNATO", "fulfillable_quantity": "1"}	ordered	0	{}	2025-04-29 09:02:02.545608	2025-04-29 19:11:21.338	f	\N
4224	22	SW-1570-1	Innato Dm4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Innato Dm4", "color": "Smokefired Blue with Red and Bronze Bubbles", "model": "INNATO"}	archived	0	{}	2025-04-29 09:53:18.487001	2025-04-29 10:43:37.195	t	Automatically marked as archived during Shopify sync
1290	33	SW-1559-1	Innato Am3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Innato Am3", "color": "Blue, with Terra and Gold Bubbles", "model": "INNATO", "fulfillable_quantity": "1"}	ordered	0	{}	2025-04-29 09:02:03.227052	2025-04-29 19:11:21.943	f	\N
1294	37	SW-1555-1	Innato Am3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Innato Am3", "color": "Blue, with Terra and Gold Bubbles", "model": "INNATO", "fulfillable_quantity": "1"}	ordered	0	{}	2025-04-29 09:02:06.402622	2025-04-29 19:11:23.873	f	\N
1295	37	SW-1555-2	Innato Am3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "432 Hz", "type": "Innato Am3", "color": "Blue, with Terra and Gold Bubbles", "model": "INNATO", "fulfillable_quantity": "1"}	ordered	0	{}	2025-04-29 09:02:06.461241	2025-04-29 19:11:23.992	f	\N
1296	37	SW-1555-5	Innato Cm4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "432 Hz", "type": "Innato Cm4", "color": "Blue, with Terra and Gold Bubbles", "model": "INNATO", "fulfillable_quantity": "1"}	ordered	0	{}	2025-04-29 09:02:06.519589	2025-04-29 19:11:24.236	f	\N
1297	37	SW-1555-7	Innato Cm4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "432 Hz", "type": "Innato Cm4", "color": "Smokefired Blue with Red and Bronze Bubbles", "model": "INNATO", "fulfillable_quantity": "1"}	ordered	0	{}	2025-04-29 09:02:06.578243	2025-04-29 19:11:24.42	f	\N
1262	12	SW-1580-1	Innato Cm4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "432 Hz", "type": "Innato Cm4", "color": "Blue, with Terra and Gold Bubbles", "model": "INNATO", "fulfillable_quantity": "1"}	ordered	0	{}	2025-04-29 09:01:51.644455	2025-04-29 20:21:11.191	f	\N
3988	1	SW-1591-1	ZEN flute Large	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"type": "ZEN flute Large", "color": "Blue, with Terra and Gold Bubbles", "model": "ZEN", "fulfillable_quantity": "1"}	ordered	0	{}	2025-04-29 09:42:41.667904	2025-04-29 20:21:05.18	f	\N
3991	2	SW-1590-1	Innato Em4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Innato Em4", "color": "Blue, with Terra and Gold Bubbles", "model": "INNATO", "fulfillable_quantity": "1"}	ordered	0	{}	2025-04-29 09:42:42.271415	2025-04-29 20:21:05.793	f	\N
3995	3	SW-1589-1	Natey Dm4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "432 Hz", "type": "Natey Dm4", "color": "Blue, with Terra and Gold Bubbles", "model": "NATEY", "fulfillable_quantity": "1"}	ordered	0	{}	2025-04-29 09:42:42.867255	2025-04-29 20:21:06.408	f	\N
4000	4	SW-1588-1	Natey G#m4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "432 Hz", "type": "Natey G#m4", "color": "Smokefired Terra with Terra and bronze Bubbles", "model": "NATEY", "fulfillable_quantity": "1"}	ordered	0	{}	2025-04-29 09:42:43.6645	2025-04-29 20:21:06.998	f	\N
4068	32	SW-1560-4	Innato G#m3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Innato G#m3", "color": "Smokefired Blue with Red and Bronze Bubbles", "model": "INNATO", "fulfillable_quantity": "1"}	ordered	0	{}	2025-04-29 09:43:04.939177	2025-04-29 19:11:21.458	f	\N
1869	50	SW-1542-21	Natey Bm3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Natey Bm3", "color": "Smokefired Blue with Red and Bronze Bubbles", "model": "NATEY", "fulfillable_quantity": "0"}	ordered	0	{}	2025-04-29 09:13:36.148638	2025-04-29 19:11:35.394	f	\N
1870	50	SW-1542-22	Natey Bm3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Natey Bm3", "color": "Smokefired black with Terra and Copper Bubbles", "model": "NATEY", "fulfillable_quantity": "0"}	ordered	0	{}	2025-04-29 09:13:36.216287	2025-04-29 19:11:35.518	f	\N
4101	46	SW-1546-1	Innato Em3 (NEW)	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "432 Hz", "type": "Innato Em3 (NEW)", "color": "Blue, with Terra and Gold Bubbles", "model": "INNATO", "fulfillable_quantity": "1"}	ordered	0	{}	2025-04-29 09:43:17.370914	2025-04-29 19:11:30.564	f	\N
4093	38	SW-1554-3	Innato C#m4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Innato C#m4", "color": "Smokefired Terra with Terra and bronze Bubbles", "model": "INNATO", "fulfillable_quantity": "1"}	ordered	0	{}	2025-04-29 09:43:12.674137	2025-04-29 19:11:26.293	f	\N
4102	47	SW-1545-1	Natey Am4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Natey Am4", "color": "Smokefired Blue with Red and Bronze Bubbles", "model": "NATEY", "fulfillable_quantity": "1"}	ordered	0	{}	2025-04-29 09:43:17.945126	2025-04-29 19:11:31.17	f	\N
4094	39	SW-1553-1	Natey Gm3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Natey Gm3", "color": "Smokefired Terra with Terra and bronze Bubbles", "model": "NATEY", "fulfillable_quantity": "1"}	ordered	0	{}	2025-04-29 09:43:13.351461	2025-04-29 19:11:26.922	f	\N
4103	48	SW-1544-1	Natey C#m4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Natey C#m4", "color": "Blue, with Terra and Gold Bubbles", "model": "NATEY", "fulfillable_quantity": "1"}	ordered	0	{}	2025-04-29 09:43:18.518337	2025-04-29 19:11:31.775	f	\N
4095	40	SW-1552-1	Innato Gm3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "432 Hz", "type": "Innato Gm3", "color": "Blue, with Terra and Gold Bubbles", "model": "INNATO", "fulfillable_quantity": "1"}	ordered	0	{}	2025-04-29 09:43:13.94866	2025-04-29 19:11:27.524	f	\N
4104	49	SW-1543-1	Innato Cm4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Innato Cm4", "color": "Blue, with Terra and Gold Bubbles", "model": "INNATO", "fulfillable_quantity": "1"}	ordered	0	{}	2025-04-29 09:43:19.090318	2025-04-29 19:11:32.408	f	\N
1862	50	SW-1542-14	Natey Am3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Natey Am3", "color": "Smokefired Blue with Red and Bronze Bubbles", "model": "NATEY", "fulfillable_quantity": "0"}	ordered	0	{}	2025-04-29 09:13:34.603816	2025-04-29 19:11:34.534	f	\N
4096	41	SW-1551-1	ZEN flute Large	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"type": "ZEN flute Large", "color": "Blue, with Terra and Gold Bubbles", "model": "ZEN", "fulfillable_quantity": "1"}	ordered	0	{}	2025-04-29 09:43:14.604051	2025-04-29 19:11:28.129	f	\N
4097	42	SW-1550-1	Innato F#m3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "432 Hz", "type": "Innato F#m3", "color": "Blue, with Terra and Gold Bubbles", "model": "INNATO", "fulfillable_quantity": "1"}	ordered	0	{}	2025-04-29 09:43:15.174905	2025-04-29 19:11:28.738	f	\N
4099	44	SW-1548-1	Innato Am3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Innato Am3", "color": "Smokefired Blue with Red and Bronze Bubbles", "model": "INNATO", "fulfillable_quantity": "1"}	ordered	0	{}	2025-04-29 09:43:16.216358	2025-04-29 19:11:29.35	f	\N
4100	45	SW-1547-1	Innato Bbm3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "432 Hz", "type": "Innato Bbm3", "color": "Smokefired black with Terra and Copper Bubbles", "model": "INNATO", "fulfillable_quantity": "1"}	ordered	0	{}	2025-04-29 09:43:16.788677	2025-04-29 19:11:29.958	f	\N
2330	166	SW-1427-1	Natey flute	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "Black with Red/Copper bubbles Smokefired", "type": "Natey flute", "color": "G#4", "model": "NATEY", "tuning": "440 Hz", "tuningFrequency": "440 Hz"}	ordered	0	{}	2025-04-29 09:19:14.813712	2025-04-29 09:19:14.813712	f	\N
1299	37	SW-1555-10	Innato F#m3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "432 Hz", "type": "Innato F#m3", "color": "Smokefired black with Terra and Copper Bubbles", "model": "INNATO", "fulfillable_quantity": "2"}	ordered	0	{}	2025-04-29 09:02:06.697001	2025-04-29 19:11:24.721	f	\N
1300	37	SW-1555-13	Innato F#m3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Innato F#m3", "color": "Blue, with Terra and Gold Bubbles", "model": "INNATO", "fulfillable_quantity": "1"}	ordered	0	{}	2025-04-29 09:02:06.756333	2025-04-29 19:11:25.082	f	\N
1301	37	SW-1555-14	Innato F#m3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Innato F#m3", "color": "Smokefired black with Terra and Copper Bubbles", "model": "INNATO", "fulfillable_quantity": "1"}	ordered	0	{}	2025-04-29 09:02:06.813688	2025-04-29 19:11:25.208	f	\N
1302	37	SW-1555-15	Natey Em4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Natey Em4", "color": "Smokefired black with Terra and Copper Bubbles", "model": "NATEY", "fulfillable_quantity": "1"}	ordered	0	{}	2025-04-29 09:02:06.871415	2025-04-29 19:11:25.328	f	\N
1303	38	SW-1554-1	Natey G#m3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Natey G#m3", "color": "Smokefired Blue with Red and Bronze Bubbles", "model": "NATEY", "fulfillable_quantity": "1"}	ordered	0	{}	2025-04-29 09:02:07.695729	2025-04-29 19:11:26.049	f	\N
1304	38	SW-1554-2	ZEN flute Large	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"type": "ZEN flute Large", "color": "Blue, with Terra and Gold Bubbles", "model": "ZEN", "fulfillable_quantity": "1"}	ordered	0	{}	2025-04-29 09:02:07.754484	2025-04-29 19:11:26.17	f	\N
1320	50	SW-1542-4	Innato Cm4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Innato Cm4", "color": "Blue, with Terra and Gold Bubbles", "model": "INNATO", "fulfillable_quantity": "2"}	ordered	0	{}	2025-04-29 09:02:18.777539	2025-04-29 19:11:33.311	f	\N
1321	50	SW-1542-5	Innato Cm4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Innato Cm4", "color": "Smokefired Terra with Terra and bronze Bubbles", "model": "INNATO", "fulfillable_quantity": "2"}	ordered	0	{}	2025-04-29 09:02:18.835721	2025-04-29 19:11:33.431	f	\N
1322	50	SW-1542-6	Innato Cm4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Innato Cm4", "color": "Smokefired Terra and Black", "model": "INNATO", "fulfillable_quantity": "3"}	ordered	0	{}	2025-04-29 09:02:18.894078	2025-04-29 19:11:33.552	f	\N
1324	50	SW-1542-8	Innato Bm3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Innato Bm3", "color": "Smokefired black with Terra and Copper Bubbles", "model": "INNATO", "fulfillable_quantity": "2"}	ordered	0	{}	2025-04-29 09:02:19.010463	2025-04-29 19:11:33.796	f	\N
1342	50	SW-1542-34	Natey Fm4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Natey Fm4", "color": "Smokefired Blue with Red and Bronze Bubbles", "model": "NATEY", "fulfillable_quantity": "1"}	archived	0	{}	2025-04-29 09:02:20.094395	2025-04-29 12:46:55.399	t	Verwijderd uit Shopify - handmatig gearchiveerd
1340	50	SW-1542-32	Natey F#m4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Natey F#m4", "color": "Smokefired Blue with Red and Bronze Bubbles", "model": "NATEY", "fulfillable_quantity": "1"}	ordered	0	{}	2025-04-29 09:02:19.974453	2025-04-29 19:11:36.725	f	\N
1341	50	SW-1542-33	Natey F#m4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Natey F#m4", "color": "Smokefired black with Terra and Copper Bubbles", "model": "NATEY", "fulfillable_quantity": "1"}	ordered	0	{}	2025-04-29 09:02:20.033662	2025-04-29 19:11:36.844	f	\N
1353	51	SW-1541-1	Innato C#m4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Innato C#m4", "color": "Smokefired Blue with Red and Bronze Bubbles", "model": "INNATO", "fulfillable_quantity": "1"}	ordered	0	{}	2025-04-29 09:02:21.408417	2025-04-29 19:11:40.944	f	\N
1354	51	SW-1541-2	Double Large Native Gm3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Double Large Native Gm3", "color": "Smokefired Terra with Terra and bronze Bubbles", "model": "DOUBLE", "fulfillable_quantity": "1"}	ordered	0	{}	2025-04-29 09:02:21.467413	2025-04-29 19:11:41.065	f	\N
2364	178	SW-1415-1	Innato flute	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "Smokefired black/ Red and Copper Bubbles", "type": "Innato flute", "color": "Bb - medium/ large hands", "model": "INNATO", "tuning": "432 Hz", "tuningFrequency": "432 Hz"}	ordered	0	{}	2025-04-29 09:19:25.540726	2025-04-29 09:19:25.540726	f	\N
1366	63	SW-1530-1	Innato Exploration Cards	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"type": "Innato Exploration Cards", "model": "INNATO", "fulfillable_quantity": "1"}	ordered	0	{}	2025-04-29 09:02:27.463056	2025-04-29 12:33:31.953	f	\N
1892	50	SW-1542-44	Natey Gm4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Natey Gm4", "color": "Blue, with Terra and Gold Bubbles", "model": "NATEY", "fulfillable_quantity": "0"}	archived	0	{}	2025-04-29 09:13:40.076284	2025-04-29 12:40:44.275	t	Verwijderd uit Shopify - handmatig gearchiveerd
2627	37	SW-1555-8	Innato Cm4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "432 Hz", "type": "Innato Cm4", "color": "Smokefired Terra with Terra and bronze Bubbles", "model": "INNATO", "fulfillable_quantity": "1"}	ordered	0	{}	2025-04-29 09:21:26.443795	2025-04-29 19:11:24.54	f	\N
1893	50	SW-1542-45	Natey Gm4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"key": "440 Hz", "type": "Natey Gm4", "color": "Smokefired Blue with Red and Bronze Bubbles", "model": "NATEY", "fulfillable_quantity": "0"}	archived	0	{}	2025-04-29 09:13:40.135798	2025-04-29 12:35:36.102	t	Item niet meer aanwezig in Shopify order - specifieke fix voor order 1542
\.


--
-- TOC entry 3478 (class 0 OID 32780)
-- Dependencies: 219
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.orders (id, order_number, shopify_order_id, customer_name, customer_email, customer_phone, customer_address, customer_city, customer_state, customer_zip, customer_country, order_type, is_reseller, reseller_nickname, status, order_date, deadline, notes, progress, specifications, status_change_dates, build_date, archived, tracking_number, tracking_company, tracking_url, shipped_date, estimated_delivery_date, delivery_status, delivered_date, created_at, updated_at) FROM stdin;
1	SW-1591	6605962412363	Marta paccagnella	paccagn@gmail.com	+447751773744	Flat 4 Banfield House, 4 Troubridge Square	London	England	E17 3GQ	United Kingdom	retail	f	\N	ordered	2025-04-23 18:24:11	\N		0	{"type": "ZEN flute Large", "color": "Blue, with Terra and Gold Bubbles", "model": "ZEN"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-04-24 22:19:10.777988	2025-04-24 22:19:10.777988
2	SW-1590	6604801507659	Brennan Gudmundson	brennanmg1@gmail.com	(312) 848-0001	1307 West Erie Street, 2	Chicago	Illinois	60642	United States	retail	f	\N	ordered	2025-04-23 03:26:37	\N		0	{"key": "440 Hz", "type": "Innato Em4", "color": "Blue, with Terra and Gold Bubbles", "model": "INNATO"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-04-24 22:19:11.034817	2025-04-24 22:19:11.034817
3	SW-1589	6598869025099	Jill Glozier	jillwerndly@hotmail.com	+447737403791	11 Moore Avenue	South Shields	England	NE34 6AA	United Kingdom	retail	f	\N	ordered	2025-04-19 08:32:15	\N		0	{"key": "432 Hz", "type": "Natey Dm4", "color": "Blue, with Terra and Gold Bubbles", "model": "NATEY"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-04-24 22:19:11.276434	2025-04-24 22:19:11.276434
4	SW-1588	6598590628171	Oliver Dür	oliver.duer@gmail.com	6604830112	Hof 302	Reuthe	\N	6870	Austria	retail	f	\N	ordered	2025-04-18 21:27:55	\N		0	{"key": "432 Hz", "type": "Natey G#m4", "color": "Smokefired Terra with Terra and bronze Bubbles", "model": "NATEY"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-04-24 22:19:11.527743	2025-04-24 22:19:11.527743
6	SW-1586	6596973330763	Wen Colenbrander	coltha@gmail.com	0653130517	Prinses Marijkelaan 19, 3hoog	Zeist	\N	3708 DA	Netherlands	retail	f	\N	ordered	2025-04-17 16:40:45	\N		0	{"type": "ZEN flute Medium", "color": "Smokefired Terra and Black", "model": "ZEN"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-04-24 22:19:13.198707	2025-04-24 22:19:13.198707
7	SW-1585	6590855250251	John Martin	jdalmartin@hotmail.com	2503338599	561 NOOTKA RD, Nootka Road	QUALICUM BEACH	British Columbia	V9K 1A3	Canada	retail	f	\N	ordered	2025-04-13 22:26:16	\N		0	{"key": "440 Hz", "type": "Innato Dm4", "color": "Smokefired Blue with Red and Bronze Bubbles", "model": "INNATO"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-04-24 22:19:13.437515	2025-04-24 22:19:13.437515
8	SW-1584	6588193243467	Holly Mckenzie	thundertrix@yahoo.co.uk	+447904744950	14 Bridgend	Dunblane	Scotland	FK15 9ES	United Kingdom	retail	f	\N	ordered	2025-04-12 09:02:34	\N		0	{"type": "ZEN flute Medium", "color": "Smokefired Terra and Black", "model": "ZEN"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-04-24 22:19:13.677364	2025-04-24 22:19:13.677364
9	SW-1583	6587931033931	Brittney Barnes	brittney.barnes93@gmail.com	9733429982	380 MT PROSPECT AVE, APT 14B	Newark	New Jersey	07104	United States	retail	f	\N	ordered	2025-04-12 02:57:45	\N		0	{"type": "Innato Exploration Cards", "model": "INNATO"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-04-24 22:19:13.932462	2025-04-24 22:19:13.932462
10	SW-1582	6586534035787	Walter Nelson	cof40@yahoo.com	+13022704688	1051 Hickory Ridge Rd	Smyrna	Delaware	19977	United States	retail	f	\N	ordered	2025-04-10 23:18:55	\N		0	{"key": "440 Hz", "type": "Natey Gm3", "color": "Blue, with Terra and Gold Bubbles", "model": "NATEY"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-04-24 22:19:14.177525	2025-04-24 22:19:14.177525
11	SW-1581	6586475675979	Ian Lee	ianrlee20@gmail.com	+17034091815	9880 McGill Ct	Manassas	Virginia	20109	United States	retail	f	\N	ordered	2025-04-10 21:20:54	\N		0	{"key": "432 Hz", "type": "Innato Bbm3", "color": "Blue, with Terra and Gold Bubbles", "model": "INNATO"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-04-24 22:19:14.422409	2025-04-24 22:19:14.422409
12	SW-1580	6585441255755	Iselin Grayston	iselin.grayston@gmail.com	+4799323643	Ramshaugvegen 24	Bryne	\N	4340	Norway	retail	f	\N	ordered	2025-04-10 09:24:28	\N		0	{"key": "432 Hz", "type": "Innato Cm4", "color": "Blue, with Terra and Gold Bubbles", "model": "INNATO"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-04-24 22:19:14.669418	2025-04-24 22:19:14.669418
13	SW-1579	6584069357899	Jacob Glum	autrix94@gmail.com	18453137099	11 Horicon Ave, apt 1	Warrensburg	New York	12885	United States	retail	f	\N	ordered	2025-04-09 10:33:04	\N		0	{"key": "440 Hz", "type": "Innato Bbm3", "color": "Smokefired Blue with Red and Bronze Bubbles", "model": "INNATO"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-04-24 22:19:14.97922	2025-04-24 22:19:14.97922
14	SW-1578	6579398279499	Jessica Veksler	jessicaveksler@gmail.com	+14252601033	3833 Renton Ave S	Seattle	Washington	98108-1640	United States	retail	f	\N	ordered	2025-04-06 05:18:28	\N		0	{"key": "432 Hz", "type": "Innato C#m4", "color": "Blue, with Terra and Gold Bubbles", "model": "INNATO"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-04-24 22:19:15.226664	2025-04-24 22:19:15.226664
15	SW-1577	6573507641675	Mia Malcyone	mia@ecospace.se	+46707515776	Synålsvägen 21	Bromma	\N	168 73	Sweden	retail	f	\N	ordered	2025-04-02 01:15:41	\N		0	{"key": "440 Hz", "type": "Innato Em4", "color": "Smokefired Blue with Red and Bronze Bubbles", "model": "INNATO"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-04-24 22:19:15.477957	2025-04-24 22:19:15.477957
16	SW-1576	6572894978379	Lucas Temple	lucas.van.temple@gmail.com	9046277455	72 Mandy Circle	Santa Rosa Beach	Florida	32459	United States	retail	f	\N	ordered	2025-04-01 15:35:43	\N		0	{"key": "440 Hz", "type": "Natey Am4", "color": "Smokefired Blue with Red and Bronze Bubbles", "model": "NATEY"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-04-24 22:19:15.758361	2025-04-24 22:19:15.758361
17	SW-1575	6572002148683	Marc Footman	marc_footman@hotmail.com	+447415129883	89, Parkside Crescent	Telford	England	TF1 5GT	United Kingdom	retail	f	\N	ordered	2025-04-01 00:04:10	\N		0	{"key": "440 Hz", "type": "Natey Dm4", "color": "Smokefired Blue with Red and Bronze Bubbles", "model": "NATEY"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-04-24 22:19:16.007529	2025-04-24 22:19:16.007529
20	SW-1572	6552928977227	Thea Seuntiëns	thea_seuntiens@hotmail.com	+31402041423	Henry Hudsonhof 15	Valkenswaard	\N	5554 PC	Netherlands	retail	f	\N	ordered	2025-03-21 14:39:01	\N		0	{"key": "440 Hz", "type": "Natey Cm4", "color": "Smokefired Blue with Red and Bronze Bubbles", "model": "NATEY"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-04-24 22:19:16.777339	2025-04-24 22:19:16.777339
21	SW-1571	6551888167243	Nicholas Evers	nicoeversdesign@gmail.com	(415) 298-1608	1604 NE Bryant st.	Portland	Oregon	97211	United States	retail	f	\N	ordered	2025-03-20 18:58:15	\N		0	{"key": "440 Hz", "type": "Innato Dm4", "color": "Smokefired Blue with Red and Bronze Bubbles", "model": "INNATO"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-04-24 22:19:17.027538	2025-04-24 22:19:17.027538
24	SW-1568	6550745678155	Becky Hayling	meempster@gmail.com	07754220937	56 Cotswold Road	Bath	England	BA2 2DL	United Kingdom	retail	f	\N	ordered	2025-03-19 22:20:41	\N		0	{"key": "440 Hz", "type": "Innato Cm4", "color": "Smokefired Blue with Red and Bronze Bubbles", "model": "INNATO"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-04-24 22:19:17.769501	2025-04-24 22:19:17.769501
18	SW-1574	6559540183371	Kerem Brule	kerembrule@gmail.com	+16195492924	9 Harbour Isle Drive East, Apt 102	Fort Pierce	Florida	34949	United States	retail	t	KEREM	ordered	2025-03-25 16:28:18	\N		0	{"key": "432 Hz", "type": "Innato Bm3", "color": "Blue, with Terra and Gold Bubbles", "model": "INNATO"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-04-24 22:19:16.263019	2025-04-25 12:04:39.456
5	SW-1587	6598520865099	Ivo Sedlacek	info@savita.cz	+420603481984	V Aleji 42	Jablonec nad Nisou	\N	466 01	Czech Republic	reseller	t	IVO	delivered	2025-04-18 20:07:56	\N	GEDEELTELIJK GEFULFILD: 17 items reeds verzonden, 3 items nog actief.	0	{"key": "432 Hz", "type": "Natey Am3", "color": "Smokefired Blue with Red and Bronze Bubbles", "model": "NATEY"}	{}	\N	f	\N	\N	\N	2025-04-29 06:05:15	\N	delivered	2025-04-29 06:05:15	2025-04-24 22:19:11.787045	2025-04-29 06:09:02.668
25	SW-1567	6549184807243	Jimmy Ward	jimmyward@outlook.com	07914945610	27 Brownleaf Road	Brighton and Hove	England	BN2 6LD	United Kingdom	retail	f	\N	ordered	2025-03-18 19:01:22	\N		0	{"key": "432 Hz", "type": "Natey Am4", "color": "Blue, with Terra and Gold Bubbles", "model": "NATEY"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-04-24 22:19:18.015296	2025-04-24 22:19:18.015296
26	SW-1566	6547863568715	R Frijns	rfrijns@planet.nl	+31650976676	Professor Huetlaan 17	Laag-Soeren	\N	6957 AP	Netherlands	retail	f	\N	ordered	2025-03-17 18:35:51	\N		0	{"key": "432 Hz", "type": "Natey Am3", "color": "Smokefired Terra with Terra and bronze Bubbles", "model": "NATEY"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-04-24 22:19:18.259189	2025-04-24 22:19:18.259189
27	SW-1565	6546879086923	Ellie Strange	elliestrange66@gmail.com	+447715643409	Flat 6, Winn Court, Winn Road	Southampton	England	SO17 1UZ	United Kingdom	retail	f	\N	ordered	2025-03-17 07:14:20	\N		0	{"key": "440 Hz", "type": "Natey G#m4", "color": "Smokefired Blue with Red and Bronze Bubbles", "model": "NATEY"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-04-24 22:19:18.509347	2025-04-24 22:19:18.509347
28	SW-1564	6546625626443	Katherine Perry	kateperry94@gmail.com	+17608556228	770 Avenida Codorniz	San Marcos	California	92069	United States	retail	f	\N	ordered	2025-03-16 21:00:41	\N		0	{"key": "440 Hz", "type": "Innato Em4", "color": "Blue, with Terra and Gold Bubbles", "model": "INNATO"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-04-24 22:19:18.754564	2025-04-24 22:19:18.754564
29	SW-1563	6546511200587	Lotus Shields	shieldslotus@gmail.com	+447724084325	38 Trafalgar way	Braintree	England	CM7 9UX	United Kingdom	retail	f	\N	ordered	2025-03-16 19:38:36	\N		0	{"key": "440 Hz", "type": "Innato Cm4", "color": "Smokefired black with Terra and Copper Bubbles", "model": "INNATO"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-04-24 22:19:18.991694	2025-04-24 22:19:18.991694
31	SW-1561	6544465592651	Alejandro De Antonio	aldeantonioluthier@gmail.com	680697219	Calle Real 39B	Cañicosa	Segovia	40163	Spain	retail	f	\N	ordered	2025-03-15 12:03:13	\N		0	{"key": "440 Hz", "type": "Innato Bm3", "color": "Smokefired Blue with Red and Bronze Bubbles", "model": "INNATO"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-04-24 22:19:19.482566	2025-04-24 22:19:19.482566
34	SW-1558	6542916616523	cindy charlier	Sam.Majer@pandora.be	0475628455	Havikstraat 25	Dilsen-Stokkem	\N	3650	Belgium	retail	f	\N	ordered	2025-03-14 09:59:46	\N		0	{"key": "432 Hz", "type": "Innato Cm4", "color": "Smokefired Blue with Red and Bronze Bubbles", "model": "INNATO"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-04-24 22:19:20.567588	2025-04-24 22:19:20.567588
35	SW-1557	6537826173259	Raquel Jensen	rjrpaintings@gmail.com	2064464150	4213 Basswood Rd	Freeland	Washington	98249	United States	retail	f	\N	ordered	2025-03-10 22:15:55	\N		0	{"key": "440 Hz", "type": "Innato Am3", "color": "Smokefired Terra with Terra and bronze Bubbles", "model": "INNATO"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-04-24 22:19:20.816158	2025-04-24 22:19:20.816158
38	SW-1554	6531302555979	Nikolas Cramer Klett	ck78@protonmail.com	00491727864848	Cramer Klett  14	Aschau	\N	83229	Germany	retail	f	\N	ordered	2025-03-07 09:19:58	\N		0	{"key": "440 Hz", "type": "Natey G#m3", "color": "Smokefired Blue with Red and Bronze Bubbles", "model": "NATEY"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-04-24 22:19:22.425906	2025-04-24 22:19:22.425906
39	SW-1553	6530875687243	Lindsey Morris	lindseymorris777@gmail.com	+12089495413	1800 North New Hampshire Avenue, 114	Los Angeles	California	90027	United States	retail	f	\N	ordered	2025-03-07 04:25:52	\N		0	{"key": "440 Hz", "type": "Natey Gm3", "color": "Smokefired Terra with Terra and bronze Bubbles", "model": "NATEY"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-04-24 22:19:22.782925	2025-04-24 22:19:22.782925
40	SW-1552	6510324515147	Viënna Mollers	viennageerlings81@hotmail.com	+31624953539	Teggert 54	Voerendaal	\N	6367 XN	Netherlands	retail	f	\N	ordered	2025-03-05 08:40:14	\N		0	{"key": "432 Hz", "type": "Innato Gm3", "color": "Blue, with Terra and Gold Bubbles", "model": "INNATO"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-04-24 22:19:23.030547	2025-04-24 22:19:23.030547
41	SW-1551	6506851107147	Patricia Jefferson	Stepjefferson1@gmail.com	+17074806317	6772 Greenwood Ln	Sebastopol	California	95472	United States	retail	f	\N	ordered	2025-03-02 21:45:42	\N		0	{"type": "ZEN flute Large", "color": "Blue, with Terra and Gold Bubbles", "model": "ZEN"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-04-24 22:19:23.270485	2025-04-24 22:19:23.270485
42	SW-1550	6505348727115	Adam Partridge	apsoundimage@gmail.com	(718) 753-3517	241 Silver Hollow Road (#341)	Willow	New York	12495	United States	retail	f	\N	ordered	2025-03-01 20:43:30	\N		0	{"key": "432 Hz", "type": "Innato F#m3", "color": "Blue, with Terra and Gold Bubbles", "model": "INNATO"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-04-24 22:19:23.515143	2025-04-24 22:19:23.515143
235	SW-1358	6112593215819	Kerem Brule	kerembrule@gmail.com	+16195492924	1301 Lyttleton Street	Camden	South Carolina	29020	United States	reseller	t	KEREM	delivered	2024-07-17 16:17:45	\N		0	{"key": "A - medium/ large hands", "type": "Innato flute", "color": "Blue/ Red and Gold Bubbles", "model": "INNATO", "tuning": "432 Hz", "tuningFrequency": "432 Hz"}	{}	\N	f	279757400330	FedEx	https://www.fedex.com/fedextrack/?trknbr=279757400330	2024-09-21 07:30:55	2025-04-27 22:32:45.107	in_transit	\N	2025-04-24 22:20:18.838298	2025-04-28 19:19:18.754
44	SW-1548	6501454086475	Miklós Heim-Tóth	miklos.toth2@gmail.com	+36704253440	Fő utca 89	Barnag	\N	8291	Hungary	retail	f	\N	ordered	2025-02-27 11:06:21	\N		0	{"key": "440 Hz", "type": "Innato Am3", "color": "Smokefired Blue with Red and Bronze Bubbles", "model": "INNATO"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-04-24 22:19:24.013029	2025-04-24 22:19:24.013029
45	SW-1547	6500626825547	Charles-Thibault Verrier	charles.thibault.verrier@gmail.com	+33699984524	21 Claypit Crescent	Manchester	England	M19 2ZL	United Kingdom	retail	f	\N	ordered	2025-02-26 21:00:05	\N		0	{"key": "432 Hz", "type": "Innato Bbm3", "color": "Smokefired black with Terra and Copper Bubbles", "model": "INNATO"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-04-24 22:19:24.253789	2025-04-24 22:19:24.253789
46	SW-1546	6499079258443	Aleksei Kalibin	a.atomsky@me.com	+34675994126	Malagankatu 4c, 69	Helsinki	\N	00220	Finland	retail	f	\N	ordered	2025-02-25 19:46:07	\N		0	{"key": "432 Hz", "type": "Innato Em3 (NEW)", "color": "Blue, with Terra and Gold Bubbles", "model": "INNATO"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-04-24 22:19:24.490084	2025-04-24 22:19:24.490084
36	SW-1556	6532308697419	Yoonsuk Choe	yoonschoe@gmail.com	+46790684948	Tegnérgatan 40, LGH 1108	Stockholm	\N	113 59	Sweden	retail	f	\N	delivered	2025-03-07 20:11:13	\N		0	{"key": "440 Hz", "type": "Innato Em4", "color": "Smokefired black with Terra and Copper Bubbles", "model": "INNATO"}	{}	\N	f	05112925388957	DPD NL	https://www.dpdgroup.com/nl/mydpd/my-parcels/search?lang=nl_NL&parcelNumber=05112925388957	2025-04-20 19:06:49	\N	delivered	2025-04-20 19:06:49	2025-04-24 22:19:21.064304	2025-04-24 22:19:27.161
33	SW-1559	6544418373963	Billy Zanski	info@skinnybeatsdrums.com	\N	4 Eagle Street	Asheville	North Carolina	28801	United States	retail	t	BILLY	ordered	2025-03-15 11:33:37	\N		0	{"key": "440 Hz", "type": "Innato Am3", "color": "Blue, with Terra and Gold Bubbles", "model": "INNATO"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-04-24 22:19:20.15023	2025-04-25 11:52:44.185
32	SW-1560	6544442523979	Billy Zanski	info@skinnybeatsdrums.com	\N	4 Eagle Street	Asheville	North Carolina	28801	United States	retail	t	BILLY	ordered	2025-03-15 11:48:32	\N		0	{"key": "440 Hz", "type": "Innato Am3", "color": "Blue, with Terra and Gold Bubbles", "model": "INNATO"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-04-24 22:19:19.730638	2025-04-29 07:49:11.553
37	SW-1555	6531341353291	Mitia Klein	mitiaklein24@gmail.com	+33603388169	27 rue des entrepots	Saint-Ouen-sur-Seine	\N	93400	France	retail	t	MITIA	ordered	2025-03-07 09:42:18	\N		0	{"key": "440 Hz", "type": "Innato Am3", "color": "Blue, with Terra and Gold Bubbles", "model": "INNATO"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-04-24 22:19:21.30964	2025-04-25 11:51:32.811
47	SW-1545	6496689520971	Margit Abrahamsen	margita@live.dk	+4521952323	Ellensvej 1, 1tv.	Charlottenlund	\N	2920	Denmark	retail	f	\N	ordered	2025-02-24 15:05:54	\N		0	{"key": "440 Hz", "type": "Natey Am4", "color": "Smokefired Blue with Red and Bronze Bubbles", "model": "NATEY"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-04-24 22:19:24.730196	2025-04-24 22:19:24.730196
48	SW-1544	6494857232715	bas Vogelezang	2basvogelezang@gmail.com	+31629271095	Marijkestraat 28	Noordwijk	\N	2202 TV	Netherlands	retail	f	\N	ordered	2025-02-22 22:34:14	\N		0	{"key": "440 Hz", "type": "Natey C#m4", "color": "Blue, with Terra and Gold Bubbles", "model": "NATEY"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-04-24 22:19:24.975713	2025-04-24 22:19:24.975713
52	SW-1540	6476240290123	Magdalena Zawiska	m.zawiska@gmail.com	+48607302012	ul. Bergamotki 3, 140	Warszawa	\N	02-765	Poland	retail	f	\N	ordered	2025-02-11 13:30:30	\N		0	{"key": "432 Hz", "type": "Innato Am3", "color": "Smokefired Blue with Red and Bronze Bubbles", "model": "INNATO"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-04-24 22:19:29.086946	2025-04-24 22:19:29.086946
56	SW-1537	6461164749131	Max Schwanekamp	max@schwanekamp.org	+15416537672	3151 Storey Blvd	Eugene	Oregon	97405	United States	retail	f	\N	ordered	2025-02-01 18:42:49	\N	New shipping adress:\nJeannie Schwanekamp\n4343 Emily Carr Dr\nSaanich BC V8X 5E4\nCanada	0	{"key": "440 Hz", "type": "Innato Am3", "color": "Blue, with Terra and Gold Bubbles", "model": "INNATO"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-04-24 22:19:29.802321	2025-04-28 21:32:34.451
54	SW-1539	6472269824331	Andrew Shanti	3asygoing@gmail.com	9545984564	176 HIBISCUS RD	EDGEWATER	Florida	32141-7216	United States	retail	f	\N	ordered	2025-02-08 21:27:26	\N		0	{"key": "440 Hz", "type": "Innato Fm3", "color": "Blue, with Terra and Gold Bubbles", "model": "INNATO"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-04-24 22:19:29.321343	2025-04-24 22:19:29.321343
55	SW-1538	6465565655371	Nana Acheampong	acheampong.nanaksya@gmail.com	8324698994	913 Saint Johns Pl Apt 1B	Brooklyn	New York	11216-4316	United States	retail	f	\N	ordered	2025-02-04 17:22:54	\N		0	{"key": "440 Hz", "type": "Natey Em4", "color": "Smokefired black with Terra and Copper Bubbles", "model": "NATEY"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-04-24 22:19:29.557662	2025-04-24 22:19:29.557662
67	SW-1526	6442249388363	Vincent Burguet	vincent.burguet@gmail.com	+33611816064	Moulin de parentie	Chanterac	\N	24190	France	retail	f	\N	ordered	2025-01-20 08:03:01	\N		0	{"key": "440 Hz", "type": "Innato Am3", "color": "Smokefired Terra with Terra and bronze Bubbles", "model": "INNATO"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-04-24 22:19:32.488869	2025-04-28 14:21:45.98
58	SW-1535	6454666559819	Katja Vonk	vonk.katja@hotmail.com	0610219196	Hanetangerweg 6, 6	Ter Apel	\N	9561 PE	Netherlands	retail	f	\N	ordered	2025-01-27 18:18:31	\N		0	{"type": "Innato Exploration Cards", "model": "INNATO"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-04-24 22:19:30.282383	2025-04-24 22:19:30.282383
63	SW-1530	6445063307595	Marlene Bochatay	mabochatay@netplus.ch	+41244714030	Chemin du Grand-Clos 52	Massongex	\N	1869	Switzerland	retail	f	\N	ordered	2025-01-22 12:11:31	\N		0	{"type": "Innato Exploration Cards", "model": "INNATO"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-04-24 22:19:31.47464	2025-04-24 22:19:31.47464
61	SW-1532	6451955597643	Kerem Brule	kerembrule@gmail.com	+16195492924	1235 West 15th 1/2 Street	Houston	Texas	77008	United States	reseller	t	KEREM	delivered	2025-01-25 23:09:30	\N		0	{"key": "432 Hz", "type": "Innato Bm3", "color": "Smokefired Blue with Red and Bronze Bubbles", "model": "INNATO"}	{}	\N	f	287706888200	FedEx	https://www.fedex.com/fedextrack/?trknbr=287706888200	2025-04-20 19:03:19	\N	delivered	2025-04-22 22:32:32.88	2025-04-24 22:19:31.005241	2025-04-28 18:54:56.381
60	SW-1533	6452738523467	Nathaniel Rubyan-Ling	nling123@gmail.com	+447825108177	25 Bonnington Road	Leicester	England	LE2 3DB	United Kingdom	retail	f	\N	delivered	2025-01-26 12:26:22	\N		0	{"key": "440 Hz", "type": "Natey Em4", "color": "Smokefired Terra with Terra and bronze Bubbles", "model": "NATEY"}	{}	\N	f	287706887260	FedEx	https://www.fedex.com/fedextrack/?trknbr=287706887260	2025-04-20 19:03:01	\N	delivered	2025-04-23 22:32:32.883	2025-04-24 22:19:30.758054	2025-04-24 22:32:50.181
62	SW-1531	6451598459211	Jennie Rekers	jennie@mana-co.nl	0655754267	Jan Campertstraat 5	Heerlen	\N	6416 SG	Netherlands	retail	f	\N	delivered	2025-01-25 17:40:49	\N		0	{"key": "432 Hz", "type": "Innato D#m4", "color": "Smokefired Terra and Black", "model": "INNATO"}	{}	\N	f	05112925388954	DPD NL	https://www.dpdgroup.com/nl/mydpd/my-parcels/search?lang=nl_NL&parcelNumber=05112925388954	2025-04-20 19:01:52	2025-04-29 22:32:33.159	in_transit	\N	2025-04-24 22:19:31.241423	2025-04-24 22:32:50.302
66	SW-1527	6444469748043	Andrew Clapper	a.clapper10@gmail.com	+16157792669	2417 Maplecrest Drive	Nashville	Tennessee	37214	United States	retail	f	\N	delivered	2025-01-21 20:17:38	\N		0	{"key": "440 Hz", "type": "Natey G#m4", "color": "Blue, with Terra and Gold Bubbles", "model": "NATEY"}	{}	\N	f	287706891056	FedEx	https://www.fedex.com/fedextrack/?trknbr=287706891056	2025-04-20 19:05:19	2025-04-25 22:32:33.283	in_transit	\N	2025-04-24 22:19:32.24796	2025-04-24 22:32:50.437
23	SW-1569	6551720362315	Kim Bemelmans	kim.bemelmans@protonmail.com	0683644963	Zonstraat 50	Kerkrade	\N	6463 AD	Netherlands	retail	f	\N	delivered	2025-03-20 16:59:27	\N		0	{"type": "OvA flute C2 64 Hz", "color": "Blue, with Terra and Gold Bubbles"}	{}	\N	f	286666231072	FedEx	https://www.fedex.com/fedextrack/?trknbr=286666231072	2025-03-20 21:13:35	\N	delivered	2025-04-23 22:32:32.873	2025-04-24 22:19:17.520438	2025-04-24 22:32:49.936
50	SW-1542	6487970120011	Ivo Sedlacek	info@savita.cz	+420603481984	V Aleji 42	Jablonec nad Nisou	\N	466 01	Czech Republic	retail	t	IVO	ordered	2025-02-18 07:47:14	\N		0	{"key": "440 Hz", "type": "Innato Dm4", "color": "Smokefired Blue with Red and Bronze Bubbles", "model": "INNATO"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-04-24 22:19:25.464434	2025-04-29 07:36:46.028
43	SW-1549	6502271058251	Trevor Joseph	trevorgjoseph@gmail.com	07876 337752	24 Simpsons Way Kennington	Oxford	England	OX1 5RZ	United Kingdom	retail	f	\N	delivered	2025-02-27 19:51:49	\N		0	{"key": "440 Hz", "type": "Innato G#m3", "color": "Blue, with Terra and Gold Bubbles", "model": "INNATO"}	{}	\N	f	287706890369	FedEx	https://www.fedex.com/fedextrack/?trknbr=287706890369	2025-04-20 19:03:40	\N	delivered	2025-04-22 22:32:32.881	2025-04-24 22:19:23.757132	2025-04-24 22:32:49.997
59	SW-1534	6453021770059	Ignazio Marcolongo	ignaziomarcolongo@gmail.com	+393406116029	Via Ceresara 16/1	Limena	Padova	35010	Italy	retail	f	\N	delivered	2025-01-26 14:41:22	\N		0	{"key": "440 Hz", "type": "Innato D#m4", "color": "Smokefired Blue with Red and Bronze Bubbles", "model": "INNATO"}	{}	\N	f	287706887741	FedEx	https://www.fedex.com/fedextrack/?trknbr=287706887741	2025-04-20 19:02:17	\N	delivered	2025-04-22 22:32:32.878	2025-04-24 22:19:30.51691	2025-04-24 22:32:50.121
65	SW-1528	6444775342411	Alexandra Avadanei	alexandra_univers@yahoo.com	0742275861	Spicului 18	Constanta	Constanța	900002	Romania	retail	f	\N	ordered	2025-01-22 07:56:01	\N		0	{"type": "ZEN flute Large", "color": "Blue, with Terra and Gold Bubbles", "model": "ZEN"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-04-24 22:19:32.013565	2025-04-25 11:56:48.461
68	SW-1525	6442112844107	Philipp Yaw	philipp_yaw@hotmail.com	079 947 23 20	Sprunglistrasse, 6	Bern	\N	3006	Switzerland	retail	f	\N	ordered	2025-01-19 23:55:09	\N		0	{"type": "ZEN flute Medium", "color": "Smokefired Terra and Black", "model": "ZEN"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-04-24 22:19:32.72587	2025-04-28 20:50:41.637
51	SW-1541	6481855512907	Onetone USA	onetonesonicalchemy@gmail.com	+13158792383	5415 Parkhill Rd	Santa Margarita	California	93453	United States	retail	t	ONETONE	ordered	2025-02-14 17:53:18	\N		0	{"key": "440 Hz", "type": "Innato C#m4", "color": "Smokefired Blue with Red and Bronze Bubbles", "model": "INNATO"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-04-24 22:19:28.722568	2025-04-25 11:51:19.845
49	SW-1543	6492194832715	Diego Vidal Velasco	infodiegovelasco@gmail.com	607064848	Avenida Pau Casals 12 5º 1ª	Barcelona	Barcelona	08021	Spain	retail	f	\N	ordered	2025-02-20 17:27:10	\N		0	{"key": "440 Hz", "type": "Innato Cm4", "color": "Blue, with Terra and Gold Bubbles", "model": "INNATO"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-04-24 22:19:25.226272	2025-04-24 22:19:25.226272
30	SW-1562	6546262360395	Shannon van der Beek	robert_paul@live.nl	0654967125	Oosteinde 13, 3274KB, Heinenoord, 13	Heinenoord	\N	3274 KB	Netherlands	retail	f	\N	delivered	2025-03-16 16:36:25	\N		0	{"key": "432 Hz", "type": "Innato Gm3", "color": "Smokefired black with Terra and Copper Bubbles", "model": "INNATO"}	{}	\N	f	\N	\N	\N	2025-03-16 16:41:08	\N	delivered	2025-03-16 16:41:08	2025-04-24 22:19:19.236222	2025-04-24 22:19:25.989
89	SW-1504	6394560971083	Oscar Smith	oscarahsmith@gmail.com	+4581919217	Madvigs Allé 4, st th	Frederiksberg C	\N	1829	Denmark	retail	f	\N	delivered	2024-12-21 19:40:25	\N		0	{"key": "440 Hz", "type": "Natey Am4", "color": "Smokefired Blue with Red and Bronze Bubbles", "model": "NATEY"}	{}	\N	f	05112925388950	FedEx	https://www.fedex.com/fedextrack/?trknbr=05112925388950	2025-04-20 18:58:51	\N	delivered	2025-04-20 18:58:52	2025-04-24 22:19:37.869051	2025-04-24 22:19:51.926
268	SW-1325	6053608227147	Kerem Brule	kerembrule@gmail.com	+16195492924	3020 S K Center St, Apt #4	McAllen	Texas	78503	United States	reseller	t	KEREM	delivered	2024-06-06 16:11:32	\N		0	{"key": "A - medium/ large hands", "type": "Innato flute", "color": "Blue/ Red and Gold Bubbles", "model": "INNATO", "tuning": "440 Hz", "tuningFrequency": "440 Hz"}	{}	\N	f	277987694919	FedEx	https://www.fedex.com/fedextrack/?trknbr=277987694919	2024-08-07 06:32:12	\N	delivered	2025-04-23 22:32:47.462	2025-04-24 22:20:29.45869	2025-04-28 19:19:27.252
93	SW-1500	6387344769355	max de Ploeg	artomax1@gmail.com	+31613337068	Ijdoornlaan 261 B1	Amsterdam	\N	1024 KM	Netherlands	retail	f	\N	delivered	2024-12-18 21:21:54	\N		0	{"key": "440 Hz", "type": "Innato Am3", "color": "Smokefired Blue with Red and Bronze Bubbles", "model": "INNATO"}	{}	\N	f	05112925388952	DPD NL	https://www.dpdgroup.com/nl/mydpd/my-parcels/search?lang=nl_NL&parcelNumber=05112925388952	2025-04-20 18:59:16	\N	delivered	2025-04-20 18:59:16	2025-04-24 22:19:38.895537	2025-04-24 22:19:54.852
95	SW-1498	6385158324555	Yoonsuk Choe	yoonschoe@gmail.com	+46790684948	Tegnergatan 40, LGH 1108	Stockholm	\N	113 59	Sweden	retail	f	\N	delivered	2024-12-18 12:58:46	\N		0	{"key": "440 Hz", "type": "Innato Am3", "color": "Blue, with Terra and Gold Bubbles", "model": "INNATO"}	{}	\N	f	05112925388396	DPD NL	https://www.dpdgroup.com/nl/mydpd/my-parcels/search?lang=nl_NL&parcelNumber=05112925388396	2025-03-20 21:07:57	\N	delivered	2025-03-20 21:07:57	2025-04-24 22:19:39.39076	2025-04-24 22:19:56.21
57	SW-1536	6460332245323	Sabrina Salzmann	sabrina.salzmann@gmx.at	00436601599412	Josef Weilandstrasse 8	Schrick	\N	2191	Austria	retail	f	\N	delivered	2025-02-01 09:10:30	\N		0	{"key": "432 Hz", "type": "Innato Em4", "color": "Smokefired Blue with Red and Bronze Bubbles", "model": "INNATO"}	{}	\N	f	286664369812	FedEx	https://www.fedex.com/fedextrack/?trknbr=286664369812	2025-03-20 21:05:50	\N	delivered	2025-04-23 22:32:32.876	2025-04-24 22:19:30.043444	2025-04-24 22:32:50.058
64	SW-1529	6445043253579	Ricardo Kirtley	andreaskirtley@yahoo.com	+18597976263	1409 Maple Rdg	New Richmond	Ohio	45157	United States	retail	f	\N	delivered	2025-01-22 11:53:24	\N		0	{"key": "432 Hz", "type": "Natey Cm4", "color": "Smokefired Terra with Terra and bronze Bubbles", "model": "NATEY"}	{}	\N	f	287706890336	FedEx	https://www.fedex.com/fedextrack/?trknbr=287706890336	2025-04-20 19:04:08	2025-04-29 22:32:33.158	in_transit	\N	2025-04-24 22:19:31.777676	2025-04-24 22:32:50.364
71	SW-1522	6439479279947	Eugenie de Weert	edeweert@hotmail.com	+31622683586	Hoeksestraat 16	Rijen	\N	5121 SV	Netherlands	retail	f	\N	delivered	2025-01-17 18:03:19	\N		0	{"key": "440 Hz", "type": "Natey Cm4", "color": "Smokefired Terra with Terra and bronze Bubbles", "model": "NATEY"}	{}	\N	f	05112925388956	DPD NL	https://www.dpdgroup.com/nl/mydpd/my-parcels/search?lang=nl_NL&parcelNumber=05112925388956	2025-04-20 19:04:28	2025-04-28 22:32:33.286	in_transit	\N	2025-04-24 22:19:33.441631	2025-04-24 22:32:50.631
92	SW-1501	6391774511435	Séverine SAINT-JALMES	sev.sj@icloud.com	0228206130	12 Résidence du Parc	Saint-Philbert-de-Grand-Lieu	\N	44310	France	retail	f	\N	delivered	2024-12-20 10:19:08	\N		0	{"key": "432 Hz", "type": "Innato Cm4", "color": "Smokefired Terra with Terra and bronze Bubbles", "model": "INNATO"}	{}	\N	f	05112925388959	DPD NL	https://www.dpdgroup.com/nl/mydpd/my-parcels/search?lang=nl_NL&parcelNumber=05112925388959	2025-04-20 19:07:59	\N	delivered	2025-04-24 22:32:34.723	2025-04-24 22:19:38.59991	2025-04-24 22:32:50.891
19	SW-1573	6556718399819	Hajo Seevers	hajo-seevers@web.de	+4915730023819	Südstrasse 3	Zürich	\N	8008	Switzerland	retail	f	\N	cancelled	2025-03-23 17:03:10	\N		0	{"key": "440 Hz", "type": "Innato Em4", "color": "Smokefired Terra and Black", "model": "INNATO"}	{"cancelled": "2025-04-29T18:59:20.947Z"}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-04-24 22:19:16.529387	2025-04-29 18:59:20.947
70	SW-1523	6440958361931	Ellen Thieleman	windsweptwellness@gmail.com	6185311066	9211 Bunkum Rd	Fairview Heights	Illinois	62208	United States	retail	f	\N	delivered	2025-01-19 03:24:03	\N		0	{"key": "432 Hz", "type": "Double Medium Native Cm4", "color": "Smokefired black with Terra and Copper Bubbles", "model": "DOUBLE"}	{}	\N	f	287706894375	FedEx	https://www.fedex.com/fedextrack/?trknbr=287706894375	2025-04-20 19:05:37	\N	delivered	2025-04-23 22:32:33.446	2025-04-24 22:19:33.198814	2025-04-24 22:32:50.567
72	SW-1521	6438464717131	Hector Epardo	hector.epardo@gmail.com	+524421817517	Bernardo Quintana 562	QUERETARO	Querétaro	76140	Mexico	retail	f	\N	delivered	2025-01-16 20:13:45	\N		0	{"key": "432 Hz", "type": "Innato Gm3", "color": "Smokefired Blue with Red and Bronze Bubbles", "model": "INNATO"}	{}	\N	f	287706894559	FedEx	https://www.fedex.com/fedextrack/?trknbr=287706894559	2025-04-20 19:06:14	2025-04-27 22:32:33.284	in_transit	\N	2025-04-24 22:19:33.675451	2025-04-24 22:32:50.703
73	SW-1520	6438196379979	Cindy Wells	bloodroot007@yahoo.com	6035044516	9 Estey Lane	Enfield	New Hampshire	03748	United States	retail	f	\N	delivered	2025-01-16 16:22:02	\N		0	{"key": "440 Hz", "type": "Innato Am3", "color": "Smokefired black with Terra and Copper Bubbles", "model": "INNATO"}	{}	\N	f	287706894765	FedEx	https://www.fedex.com/fedextrack/?trknbr=287706894765	2025-04-20 19:05:56	\N	delivered	2025-04-24 22:32:33.291	2025-04-24 22:19:33.910776	2025-04-24 22:32:50.77
85	SW-1508	6409173369163	Philipp Yaw	philipp_yaw@hotmail.com	0799472320	Sprünglistrasse 6	Bern	\N	3006	Switzerland	retail	f	\N	delivered	2024-12-28 21:38:41	\N		0	{"key": "432 Hz", "type": "Natey Dm4", "color": "Blue, with Terra and Gold Bubbles", "model": "NATEY"}	{}	\N	f	286664376230	FedEx	https://www.fedex.com/fedextrack/?trknbr=286664376230	2025-03-20 21:08:18	\N	delivered	2025-04-22 22:32:34.716	2025-04-24 22:19:36.839343	2025-04-24 22:32:50.831
74	SW-1519	6432649838923	Philipp Krause	philmalighta@icloud.com	01725162543	Erfurter Strasse 1	Dresden	\N	01127	Germany	retail	f	\N	delivered	2025-01-12 09:27:06	\N		0	{"key": "432 Hz", "type": "Innato Am3", "color": "Smokefired black with Terra and Copper Bubbles", "model": "INNATO"}	{}	\N	f	286664370790	FedEx	https://www.fedex.com/fedextrack/?trknbr=286664370790	2025-03-20 21:04:45	\N	delivered	2025-03-25 11:39:07	2025-04-24 22:19:34.149834	2025-04-24 22:19:43.198
88	SW-1505	6403727819083	Alexandra Daigle	aperri.daigle@gmail.com	+16172858394	16105 Coleman Valley Road	Occidental	California	95465	United States	retail	f	\N	ordered	2024-12-25 20:07:38	\N		0	{"type": "Innato Exploration Cards", "model": "INNATO"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-04-24 22:19:37.625498	2025-04-25 11:46:19.796
77	SW-1516	6428381282635	Marvin Schwarz	warpedrealmshop@gmail.com	+491757416004	Wilsonstraße 77	Hamburg	\N	22045	Germany	retail	f	\N	delivered	2025-01-08 23:57:57	\N		0	{"key": "440 Hz", "type": "Double Medium Native Bbm3", "color": "Smokefired Blue with Red and Bronze Bubbles", "model": "DOUBLE"}	{}	\N	f	05112925388949	DPD NL	https://www.dpdgroup.com/nl/mydpd/my-parcels/search?lang=nl_NL&parcelNumber=05112925388949	2025-04-20 18:59:39	\N	delivered	2025-04-20 18:59:39	2025-04-24 22:19:34.872721	2025-04-24 22:19:44.733
79	SW-1514	6424115151179	Seppe Roosen	seppe.roosen@screencomposers.be	+32496609666	Huisveldstraat 2B	Oudsbergen	\N	3660	Belgium	retail	f	\N	delivered	2025-01-05 15:52:35	\N		0	{"key": "440 Hz", "type": "Innato Dm4", "color": "Smokefired Terra and Black", "model": "INNATO"}	{}	\N	f	 286664369157	FedEx	https://www.fedex.com/fedextrack/?trknbr=286664369157	2025-03-20 21:05:14	\N	delivered	2025-03-25 11:39:19	2025-04-24 22:19:35.358758	2025-04-24 22:19:45.586
81	SW-1512	6420846969163	Michael Bennett	bennett.mic.s@gmail.com	6037148474	7164 East Mighty Saguaro Way	Scottsdale	Arizona	85266	United States	retail	f	\N	delivered	2025-01-03 06:10:50	\N		0	{"key": "432 Hz", "type": "Innato F#m3", "color": "Smokefired Blue with Red and Bronze Bubbles", "model": "INNATO"}	{}	\N	f	287706142574	FedEx	https://www.fedex.com/fedextrack/?trknbr=287706142574	2025-04-20 19:00:24	\N	delivered	2025-04-22 17:06:05	2025-04-24 22:19:35.834924	2025-04-24 22:19:46.999
82	SW-1511	6413064274251	Jonathan Adams	jonathanadams36@gmail.com	8084754223	244 NE 94th Ave	Portland	Oregon	97220	United States	retail	f	\N	delivered	2024-12-31 00:35:57	\N		0	{"key": "432 Hz", "type": "Innato G#m3", "color": "Smokefired black with Terra and Copper Bubbles", "model": "INNATO"}	{}	\N	f	286664372072	FedEx	https://www.fedex.com/fedextrack/?trknbr=286664372072	2025-03-20 21:06:09	\N	delivered	2025-03-26 17:52:05	2025-04-24 22:19:36.076857	2025-04-24 22:19:47.698
84	SW-1509	6409748414795	Christa Stolk	chrisgertstolk@kpnmail.nl	+31657321484	Smeestraat 4a	Veessen	\N	8194 LG	Netherlands	retail	f	\N	delivered	2024-12-29 13:41:04	\N		0	{"key": "440 Hz", "type": "Natey Am3", "color": "Smokefired Blue with Red and Bronze Bubbles", "model": "NATEY"}	{}	\N	f	\N	\N	\N	2025-04-20 20:31:24	\N	delivered	2025-04-20 20:31:24	2025-04-24 22:19:36.593034	2025-04-24 22:19:49.046
86	SW-1507	6407870611787	malena medam	malena82@gmx.de	00491701803514	Kapellenweg 27	Tübingen	\N	72070	Germany	retail	f	\N	delivered	2024-12-27 23:21:51	\N		0	{"key": "432 Hz", "type": "Innato Am3", "color": "Smokefired Terra with Terra and bronze Bubbles", "model": "INNATO"}	{}	\N	f	05112925388394	DPD NL	https://www.dpdgroup.com/nl/mydpd/my-parcels/search?lang=nl_NL&parcelNumber=05112925388394	2025-03-20 21:07:09	\N	delivered	2025-03-20 21:07:09	2025-04-24 22:19:37.074925	2025-04-24 22:19:50.379
87	SW-1506	6406096519499	Cassius Hirst	cassiushirst@gmail.com	07920024368	Thames Wharf Studios, Caretakers Flat, Rainville Road	London	England	W6 9HA	United Kingdom	retail	f	\N	delivered	2024-12-26 23:43:09	\N		0	{"key": "440 Hz", "type": "Natey F#m4", "color": "Smokefired black with Terra and Copper Bubbles", "model": "NATEY"}	{}	\N	f	286664375509	FedEx	https://www.fedex.com/fedextrack/?trknbr=286664375509	2025-03-20 21:09:03	\N	delivered	2025-03-25 16:44:25	2025-04-24 22:19:37.315061	2025-04-24 22:19:51.06
90	SW-1503	6392164581707	Gemma van Voorst	gemmavvoorst@gmail.com	+31613898863	Alberdingk Thijmlaan 9	Geleen	\N	6165 CZ	Netherlands	retail	f	\N	delivered	2024-12-20 14:11:59	\N		0	{"key": "440 Hz", "type": "Innato Am3", "color": "Blue, with Terra and Gold Bubbles", "model": "INNATO"}	{}	\N	f	05112925388395	DPD NL	https://www.dpdgroup.com/nl/mydpd/my-parcels/search?lang=nl_NL&parcelNumber=05112925388395	2025-03-20 21:06:46	\N	delivered	2025-03-20 21:06:46	2025-04-24 22:19:38.117037	2025-04-24 22:19:52.675
91	SW-1502	6391943496011	Marlieke Batelaan	batelaanmarlieke@gmail.com	+31636314798	Veneind 4	Wintelre	\N	5513 NE	Netherlands	retail	f	\N	delivered	2024-12-20 12:06:12	\N		0	{"key": "440 Hz", "type": "Natey Am4", "color": "Blue, with Terra and Gold Bubbles", "model": "NATEY"}	{}	\N	f	05112925388951	DPD NL	https://www.dpdgroup.com/nl/mydpd/my-parcels/search?lang=nl_NL&parcelNumber=05112925388951	2025-04-20 18:58:17	\N	delivered	2025-04-20 18:58:17	2025-04-24 22:19:38.355152	2025-04-24 22:19:53.381
97	SW-1496	6381627965771	Onetone USA	onetonesonicalchemy@gmail.com	+13158792383	6618 Greene St, #1	Philadelphia	Pennsylvania	19119	United States	reseller	t	ONETONE	delivered	2024-12-16 15:08:56	\N		0	{"type": "ZEN flute Large", "color": "Blue, with Terra and Gold Bubbles", "model": "ZEN"}	{}	\N	f	286664380850	FedEx	https://www.fedex.com/fedextrack/?trknbr=286664380850	2025-03-20 21:10:25	\N	delivered	2025-03-26 19:40:05	2025-04-24 22:19:40.031112	2025-04-28 18:55:47.041
102	SW-1491	6363738734923	Franca Burkhardt	franca@bandy-analytics.ch	0796165070	Dorfstrasse 26	Illhart	\N	8556	Switzerland	retail	f	\N	delivered	2024-12-07 15:08:59	\N		0	{"key": "440 Hz", "type": "Innato D#m4", "color": "Smokefired Terra and Black", "model": "INNATO"}	{}	\N	f	 286664382018	FedEx	https://www.fedex.com/fedextrack/?trknbr=286664382018	2025-03-20 21:11:11	\N	delivered	2025-04-24 22:32:36.299	2025-04-24 22:19:41.243929	2025-04-24 22:32:50.96
94	SW-1499	6385570414923	Hong-Vy Lewis	vyvyemail@gmail.com	07539768722	Flat 529 Lexington Building, 60 Fairfield Road, Bow Quarter	London	England	E3 2UF	United Kingdom	retail	f	\N	delivered	2024-12-18 16:53:52	\N		0	{"key": "440 Hz", "type": "Natey Dm4", "color": "Smokefired black with Terra and Copper Bubbles", "model": "NATEY"}	{}	\N	f	286664377339	FedEx	https://www.fedex.com/fedextrack/?trknbr=286664377339	2025-03-20 21:09:49	\N	delivered	2025-03-25 11:28:56	2025-04-24 22:19:39.149323	2025-04-24 22:19:55.511
96	SW-1497	6382934982987	David Hood	david.aj.hood@gmail.com	07886753715	24 Framfield Road	London	England	N5 1UU	United Kingdom	retail	f	\N	delivered	2024-12-17 08:22:03	\N		0	{"key": "440 Hz", "type": "Innato Cm4", "color": "Smokefired Terra with Terra and bronze Bubbles", "model": "INNATO"}	{}	\N	f	286664379044	FedEx	https://www.fedex.com/fedextrack/?trknbr=286664379044	2025-03-20 21:10:46	\N	delivered	2025-03-25 12:46:16	2025-04-24 22:19:39.792336	2025-04-24 22:19:56.971
98	SW-1495	6378993582411	samuel caro	samuel.caro@ymail.com	0608116140	15 Avenue de la Pointe Sirette	Savigny-sur-Orge	\N	91600	France	retail	f	\N	delivered	2024-12-15 09:13:17	\N		0	{"key": "440 Hz", "type": "Double Medium Native Cm4", "color": "Smokefired black with Terra and Copper Bubbles", "model": "DOUBLE"}	{}	\N	f	286664377751	FedEx	https://www.fedex.com/fedextrack/?trknbr=286664377751	2025-03-20 21:09:27	\N	delivered	2025-03-25 16:47:05	2025-04-24 22:19:40.268634	2025-04-24 22:19:58.399
99	SW-1494	6374174753099	Teresa Brito	thesaltyyogis@gmail.com	6195196273	475 Ricker Ave	Santa Rosa Beach	Florida	32459	United States	retail	f	\N	delivered	2024-12-12 13:58:18	\N		0	{"key": "432 Hz", "type": "Innato Bm3", "color": "Blue, with Terra and Gold Bubbles", "model": "INNATO"}	{}	\N	f	287706145551	FedEx	https://www.fedex.com/fedextrack/?trknbr=287706145551	2025-04-20 19:01:29	\N	delivered	2025-04-22 15:11:05	2025-04-24 22:19:40.507413	2025-04-24 22:19:59.179
100	SW-1493	6369499283787	Christina Bludau	christina_bludau@web.de	+491715065729	Teichwiesen 16	Bad Essen	\N	49152	Germany	retail	f	\N	delivered	2024-12-10 19:25:24	\N		0	{"key": "440 Hz", "type": "Natey Am4", "color": "Blue, with Terra and Gold Bubbles", "model": "NATEY"}	{}	\N	f	05112925388953	DPD NL	https://www.dpdgroup.com/nl/mydpd/my-parcels/search?lang=nl_NL&parcelNumber=05112925388953	2025-04-20 19:00:03	\N	delivered	2025-04-20 19:00:03	2025-04-24 22:19:40.765026	2025-04-24 22:19:59.904
104	SW-1489	6361412763979	Rachel Chanmugam	rachel.chanmugam@gmail.com	+94773519237	Cyclamenstraat 18	Lent	\N	6663 DM	Netherlands	retail	f	\N	delivered	2024-12-06 08:19:38	\N		0	{"key": "440 Hz", "type": "Innato Em4", "color": "Blue, with Terra and Gold Bubbles", "model": "INNATO"}	{}	\N	f	\N	\N	\N	2025-04-20 20:26:55	\N	delivered	2025-04-20 20:26:55	2025-04-24 22:19:41.727868	2025-04-24 22:20:02.649
105	SW-1488	6359024664907	Lionel Newman	phidget@gmail.com	17084152522	120 S Grove Ave, Apt. 6	Oak Park	Illinois	60302	United States	retail	f	\N	delivered	2024-12-04 21:43:21	\N		0	{"key": "440 Hz", "type": "Natey Dm4", "color": "Smokefired Terra with Terra and bronze Bubbles", "model": "NATEY"}	{}	\N	f	286663030737	FedEx	https://www.fedex.com/fedextrack/?trknbr=286663030737	2025-03-20 21:01:36	\N	delivered	2025-03-26 16:10:08	2025-04-24 22:19:41.96429	2025-04-24 22:20:03.412
106	SW-1487	6358753411403	Ramón Oliveras	contact@ramonoliveras.com	+41798256354	Rotachstrasse 30	Zürich	\N	8003	Switzerland	retail	f	\N	delivered	2024-12-04 19:05:29	\N		0	{"key": "440 Hz", "type": "Natey Cm4", "color": "Blue, with Terra and Gold Bubbles", "model": "NATEY"}	{}	\N	f	286663029744	FedEx	https://www.fedex.com/fedextrack/?trknbr=286663029744	2025-03-20 21:01:11	\N	delivered	2025-03-25 11:19:05	2025-04-24 22:19:42.198285	2025-04-24 22:20:04.128
107	SW-1486	6358474457419	Christopher White	chris@christopherwhite.online	+447903460164	17 Laton Road, flat 3	Hastings	England	TN34 2ES	United Kingdom	retail	f	\N	delivered	2024-12-04 16:32:08	\N		0	{"key": "440 Hz", "type": "Innato Em4", "color": "Smokefired black with Terra and Copper Bubbles", "model": "INNATO"}	{}	\N	f	286216029380	FedEx	https://www.fedex.com/fedextrack/?trknbr=286216029380	2025-03-08 19:49:42	\N	delivered	2025-03-12 12:54:36	2025-04-24 22:19:42.433037	2025-04-24 22:20:04.823
108	SW-1485	6356167688523	Drex Wright	drexwrightcounseling@gmail.com	8029173861	2018 Bridgman Hill Rd	Hardwick	Vermont	05843-9548	United States	retail	f	\N	delivered	2024-12-03 12:02:41	\N		0	{"key": "432 Hz", "type": "Natey G#m4", "color": "Blue, with Terra and Gold Bubbles", "model": "NATEY"}	{}	\N	f	287706139865	FedEx	https://www.fedex.com/fedextrack/?trknbr=287706139865	2025-04-20 19:01:08	\N	delivered	2025-04-22 17:11:05	2025-04-24 22:19:42.670172	2025-04-24 22:20:05.493
109	SW-1484	6355838435659	Ziad Ben-Gacem	zbengacem@gmail.com	+447901881103	22 Chester Square	London	England	SW1W 9HS	United Kingdom	retail	f	\N	delivered	2024-12-03 09:08:02	\N		0	{"key": "440 Hz", "type": "Double Medium Native Cm4", "color": "Blue, with Terra and Gold Bubbles", "model": "DOUBLE"}	{}	\N	f	286663030656	FedEx	https://www.fedex.com/fedextrack/?trknbr=286663030656	2025-03-20 21:02:06	\N	delivered	2025-03-25 16:52:25	2025-04-24 22:19:42.913166	2025-04-24 22:20:06.232
111	SW-1482	6354533712203	Cristina Albin-Lax	tina.lax@gmail.com	+14157450008	2461 East Calle Sin Controversia	Tucson	Arizona	85718	United States	retail	f	\N	delivered	2024-12-02 17:38:54	\N		0	{"type": "Innato Exploration Cards", "model": "INNATO"}	{}	\N	f	LA133977953NL	PostNL Domestic	https://jouw.postnl.nl/track-and-trace/	2024-12-04 06:52:45	\N	delivered	2024-12-04 06:52:45	2025-04-24 22:19:43.437794	2025-04-24 22:20:07.605
112	SW-1481	6354500944203	Axel Albin-Lax	axel.albinlax@gmail.com	4153367667	2461 E Calle Sin Controversia	Tucson	Arizona	85718	United States	retail	f	\N	delivered	2024-12-02 17:26:08	\N		0	{"type": "Innato Exploration Cards", "model": "INNATO"}	{}	\N	f	LA133917623NL	PostNL Domestic	https://jouw.postnl.nl/track-and-trace/	2024-12-04 06:53:40	\N	delivered	2024-12-04 06:53:40	2025-04-24 22:19:43.671926	2025-04-24 22:20:08.323
113	SW-1480	6352661184843	Sven Schnee	schnee.sven@gmx.de	+491752314922	Friedrich-Bach-Str. 11F	Bückeburg	\N	31675	Germany	retail	f	\N	delivered	2024-12-01 21:32:47	\N		0	{"type": "ZEN flute Medium", "color": "Blue, with Terra and Gold Bubbles", "model": "ZEN"}	{}	\N	f	05112925387157	DPD Germany	https://tracking.dpd.de/status/de_DE/parcel/05112925387157	2025-01-05 15:43:05	\N	delivered	2025-01-05 15:43:05	2025-04-24 22:19:43.907417	2025-04-24 22:20:09.007
76	SW-1517	6430729306443	Ema werner	ema.secova@gmail.com	664177949	Carrer la Carretera 69	Llubí	Balears	07430	Spain	retail	f	\N	delivered	2025-01-10 20:36:21	\N		0	{"key": "440 Hz", "type": "Natey F#m4", "color": "Smokefired Terra with Terra and bronze Bubbles", "model": "NATEY"}	{}	\N	f	287706893541	FedEx	https://www.fedex.com/fedextrack/?trknbr=287706893541	2025-04-20 19:04:50	\N	delivered	2025-04-22 13:12:06	2025-04-24 22:19:34.635712	2025-04-24 22:19:44.047
83	SW-1510	6410253762891	Elijah Spiros	elijahxspiros@gmail.com	+13144033120	2024 Clermont Crossing Drive, Apartment L	St. Louis	Missouri	63146	United States	retail	f	\N	delivered	2024-12-29 20:12:49	\N		0	{"key": "440 Hz", "type": "Innato Am3", "color": "Smokefired Blue with Red and Bronze Bubbles", "model": "INNATO"}	{}	\N	f	286664371488	FedEx	https://www.fedex.com/fedextrack/?trknbr=286664371488	2025-03-20 21:07:30	\N	delivered	2025-03-26 18:18:04	2025-04-24 22:19:36.320043	2025-04-24 22:19:48.398
101	SW-1492	6367806030155	Phillip Crosby	brianna.ohagan888@gmail.com	+18282844821	2566 North Carolina 80	Burnsville	North Carolina	28714	United States	retail	f	\N	delivered	2024-12-09 20:42:01	\N		0	{"key": "432 Hz", "type": "Natey Am4", "color": "Smokefired Terra with Terra and bronze Bubbles", "model": "NATEY"}	{}	\N	f	287706144669	FedEx	https://www.fedex.com/fedextrack/?trknbr=287706144669	2025-04-20 19:00:48	\N	delivered	2025-04-22 15:12:06	2025-04-24 22:19:41.001838	2025-04-24 22:20:00.564
103	SW-1490	6362182975819	Hannah Bartels	hannah.bartels@freenet.de	+4917655138224	Geißlerstraße 4	Zuffenhausen	\N	70435	Germany	retail	f	\N	delivered	2024-12-06 16:13:13	\N		0	{"key": "440 Hz", "type": "Natey Cm4", "color": "Smokefired Blue with Red and Bronze Bubbles", "model": "NATEY"}	{}	\N	f	286664381261	FedEx	https://www.fedex.com/fedextrack/?trknbr=286664381261	2025-03-20 21:10:06	\N	delivered	2025-03-24 07:15:03	2025-04-24 22:19:41.48584	2025-04-24 22:20:01.957
80	SW-1513	6420907819339	Kerem Brule	kerembrule@gmail.com	+16195492924	Rua Padre Mário Lopes 9, PT-15	Costa De Caparica	Setúbal	2825-356	Portugal	reseller	t	KEREM	delivered	2025-01-03 07:55:19	\N		0	{"key": "432 Hz", "type": "Innato Cm4", "color": "Smokefired black with Terra and Copper Bubbles", "model": "INNATO"}	{}	\N	f	05112925388393	DPD NL	https://www.dpdgroup.com/nl/mydpd/my-parcels/search?lang=nl_NL&parcelNumber=05112925388393	2025-03-20 21:04:21	\N	delivered	2025-03-20 21:04:21	2025-04-24 22:19:35.597349	2025-04-28 18:55:01.326
126	SW-1467	6336174063947	Kerem Brule	kerembrule@gmail.com	+16195492924	3029 Ludlow Road	Shaker Heights	Ohio	44120	United States	reseller	t	KEREM	delivered	2024-11-26 22:03:49	\N		0	{"key": "440 Hz", "type": "Innato Cm4", "color": "Blue, with Terra and Gold Bubbles", "model": "INNATO"}	{}	\N	f	286216030145	FedEx	https://www.fedex.com/fedextrack/?trknbr=286216030145	2025-03-08 19:50:50	\N	delivered	2025-03-14 16:53:05	2025-04-24 22:19:47.109176	2025-04-28 18:55:54.374
136	SW-1457	6302957109579	Harald Riemann	skulpturen@harald-riemann.de	08214540096	Am Fischertor 5	Augsburg	\N	86152	Germany	retail	f	\N	ordered	2024-11-16 12:51:49	\N		0	{"key": "Red with Gold Bubbles Smokefired", "type": "Natey flute", "color": "G3", "model": "NATEY", "tuning": "440 Hz", "tuningFrequency": "440 Hz"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-04-24 22:19:49.827592	2025-04-29 07:49:01.362
115	SW-1478	6352201679179	Shawn Feeney	sf@shawnfeeney.com	6313574007	16 Sherwood Ln	Highland	New York	12528	United States	retail	f	\N	delivered	2024-12-01 19:15:16	\N		0	{"type": "Innato Exploration Cards", "model": "INNATO"}	{}	\N	f	LA133965646NL	PostNL Domestic	https://jouw.postnl.nl/track-and-trace/	2024-12-04 06:54:13	\N	delivered	2024-12-04 06:54:13	2025-04-24 22:19:44.387208	2025-04-24 22:20:10.382
117	SW-1476	6348859375947	Mario Konrad	m.konrad316@gmail.com	+491726405236	Neue Str. 22a	Gaggenau	\N	76571	Germany	retail	f	\N	delivered	2024-11-30 13:47:29	\N		0	{"type": "Innato Exploration Cards", "model": "INNATO"}	{}	\N	f	LA133916693NL	PostNL Domestic	https://jouw.postnl.nl/track-and-trace/	2024-12-04 06:55:00	\N	delivered	2024-12-04 06:55:00	2025-04-24 22:19:44.865628	2025-04-24 22:20:11.749
118	SW-1475	6347797266763	James Karcher	jameskarcher93@gmail.com	+16025268726	206 E Paseo Way	Tempe	Arizona	85283	United States	retail	f	\N	delivered	2024-11-30 04:52:58	\N		0	{"key": "440 Hz", "type": "Innato Cm4", "color": "Smokefired Blue with Red and Bronze Bubbles", "model": "INNATO"}	{}	\N	f	286216029461	FedEx	https://www.fedex.com/fedextrack/?trknbr=286216029461	2025-03-08 19:48:17	\N	delivered	2025-03-14 22:45:04	2025-04-24 22:19:45.102216	2025-04-24 22:20:12.447
120	SW-1473	6344837529931	Joseph Tedesco	forum1491@gmail.com	8457023472	21609 54th Ave W	Mountlake Terrace	Washington	98043	United States	retail	f	\N	delivered	2024-11-29 10:26:45	\N		0	{"key": "440 Hz", "type": "Innato Bbm3", "color": "Smokefired Blue with Red and Bronze Bubbles", "model": "INNATO"}	{}	\N	f	286216028671	FedEx	https://www.fedex.com/fedextrack/?trknbr=286216028671	2025-03-08 19:50:03	\N	delivered	2025-03-14 16:41:04	2025-04-24 22:19:45.588248	2025-04-24 22:20:13.819
121	SW-1472	6341603066187	Shannon van der Beek	robert_paul@live.nl	0654967125	Oosteinde 13, 3274KB, Heinenoord, 13	Heinenoord	\N	3274 KB	Netherlands	retail	f	\N	delivered	2024-11-28 09:08:48	\N		0	{"key": "432 Hz", "type": "Innato Cm4", "color": "Smokefired Blue with Red and Bronze Bubbles", "model": "INNATO"}	{}	\N	f	\N	\N	\N	2025-04-20 20:25:26	\N	delivered	2025-04-20 20:25:26	2025-04-24 22:19:45.82306	2025-04-24 22:20:14.507
122	SW-1471	6340896620875	Karen Bader	karenaronoff@me.com	+15135457121	1632 Ladera Trail	Dayton	Ohio	45459	United States	retail	f	\N	delivered	2024-11-28 01:38:38	\N		0	{"key": "432 Hz", "type": "Double Medium Native Cm4", "color": "Smokefired Terra with Terra and bronze Bubbles", "model": "DOUBLE"}	{}	\N	f	286221145746	FedEx	https://www.fedex.com/fedextrack/?trknbr=286221145746	2025-03-09 08:19:16	\N	delivered	2025-04-07 23:05:04	2025-04-24 22:19:46.077575	2025-04-24 22:20:15.212
123	SW-1470	6340882432331	Karen Bader	karenaronoff@me.com	5135457121	1632 Ladera Trail	Dayton	Ohio	45459	United States	retail	f	\N	delivered	2024-11-28 01:29:54	\N		0	{"key": "432 Hz", "type": "Innato Bbm3", "color": "Smokefired Terra and Black", "model": "INNATO"}	{}	\N	f	286221145746	FedEx	https://www.fedex.com/fedextrack/?trknbr=286221145746	2025-03-09 08:18:58	\N	delivered	2025-04-07 23:05:04	2025-04-24 22:19:46.381961	2025-04-24 22:20:15.983
124	SW-1469	6340665278795	Andreas Kidess	akidess@icloud.com	+4915783086390	Hinter den Kämpen 2	Düsseldorf	\N	40489	Germany	retail	f	\N	delivered	2024-11-27 23:33:12	\N		0	{"type": "Innato Exploration Cards", "model": "INNATO"}	{}	\N	f	LA133469046NL	PostNL Domestic	https://jouw.postnl.nl/track-and-trace/	2024-12-04 06:10:53	\N	delivered	2024-12-04 06:10:53	2025-04-24 22:19:46.62057	2025-04-24 22:20:16.675
127	SW-1466	6331981889867	Fabián Granados	fgranadosposada@gmail.com	+525591984121	Londres 141 ESQUINA con Centenario	Coyoacan	Ciudad de México	04100	Mexico	retail	f	\N	delivered	2024-11-25 20:20:19	\N		0	{"key": "432 Hz", "type": "Innato Bm3", "color": "Blue, with Terra and Gold Bubbles", "model": "INNATO"}	{}	\N	f	286663029560	FedEx	https://www.fedex.com/fedextrack/?trknbr=286663029560	2025-03-20 21:02:29	\N	delivered	2025-03-27 19:32:04	2025-04-24 22:19:47.350789	2025-04-24 22:20:18.738
129	SW-1464	6325530558795	Forest Tozer	forestaston@gmail.com	07740 191524	Redcroft Annexe, Ashford Road, Bilsington	Ashford	England	TN25 7JT	United Kingdom	retail	f	\N	delivered	2024-11-24 10:38:50	\N		0	{"key": "440 Hz", "type": "Natey Am3", "color": "Smokefired Blue with Red and Bronze Bubbles", "model": "NATEY"}	{}	\N	f	286216029093	FedEx	https://www.fedex.com/fedextrack/?trknbr=286216029093	2025-03-08 19:51:11	\N	delivered	2025-03-12 11:55:57	2025-04-24 22:19:47.912604	2025-04-24 22:20:20.23
130	SW-1463	6323953566027	Margare Winmill-hermann	meh.w@btopenworld.com	+447772137784	20 Mearns Walk	Stonehaven	Scotland	AB39 2DG	United Kingdom	retail	f	\N	delivered	2024-11-23 23:29:21	\N		0	{"type": "ZEN flute Large", "color": "Blue, with Terra and Gold Bubbles", "model": "ZEN"}	{}	\N	f	284021754657	FedEx	https://www.fedex.com/fedextrack/?trknbr=284021754657	2025-01-05 15:42:43	\N	delivered	2025-01-08 12:01:05	2025-04-24 22:19:48.149285	2025-04-24 22:20:20.894
131	SW-1462	6311825146187	Marvin Schwarz	kalleklopps00@gmail.com	+491781135275	Wilsonstraße 77	Hamburg	\N	22045	Germany	retail	f	\N	delivered	2024-11-20 23:06:26	\N		0	{"key": "432 Hz", "type": "Innato Am3", "color": "Blue, with Terra and Gold Bubbles", "model": "INNATO"}	{}	\N	f	05112925387154	DPD Germany	https://tracking.dpd.de/status/de_DE/parcel/05112925387154	2025-01-05 15:41:31	\N	delivered	2025-01-05 15:41:31	2025-04-24 22:19:48.40365	2025-04-24 22:20:21.625
132	SW-1461	6307812311371	Kelly Prouse Gilbert	kellypgilbert0@gmail.com	0899447909	1 Park Avenue, Grangerath	Drogheda	Louth	A92 AK6K	Ireland	retail	f	\N	delivered	2024-11-19 13:56:58	\N		0	{"type": "ZEN flute Medium", "color": "Blue, with Terra and Gold Bubbles", "model": "ZEN"}	{}	\N	f	284021753764	FedEx	https://www.fedex.com/fedextrack/?trknbr=284021753764	2025-01-05 15:42:16	\N	delivered	2025-01-10 10:20:04	2025-04-24 22:19:48.639401	2025-04-24 22:20:22.302
134	SW-1459	6303862686027	Christkne Barnel	xtineba@mac.com	+33681761699	Moulin de radray	Loisail	\N	61400	France	retail	f	\N	delivered	2024-11-17 02:12:29	\N		0	{"key": "Smoke fired Blue/ Red and Gold Bubbles", "type": "Innato flute", "color": "E - small hands", "model": "INNATO", "engraving": "No"}	{}	\N	f	284021755035	FedEx	https://www.fedex.com/fedextrack/?trknbr=284021755035	2025-01-05 15:41:50	\N	delivered	2025-01-08 10:47:03	2025-04-24 22:19:49.230385	2025-04-24 22:20:23.808
135	SW-1458	6303671648587	Anna Bitter-Juhász	anka@ashaus.sk	+421905222608	Pekná 16, ICO 34403779	Dunajská Lužná	\N	900 42	Slovakia	retail	f	\N	delivered	2024-11-16 20:47:27	\N		0	{"key": "Blue/ Red and Gold Bubbles", "type": "Innato flute", "color": "E - small hands", "model": "INNATO", "engraving": "No"}	{}	\N	f	05112925387156	DPD Germany	https://tracking.dpd.de/status/de_DE/parcel/05112925387156	2025-01-05 15:35:49	\N	delivered	2025-01-05 15:40:52	2025-04-24 22:19:49.52725	2025-04-24 22:20:24.605
146	SW-1447	6297702433099	Kerem Brule	kerembrule@gmail.com	+16195492924	130 Joo Seng Road, #04-03	Singapore	\N	368357	Singapore	reseller	t	KEREM	delivered	2024-11-13 04:24:30	\N		0	{"key": "Smokefired black/ Red and Copper Bubbles", "type": "Innato flute", "color": "D - small hands", "model": "INNATO", "engraving": "No"}	{}	\N	f	284021716082	FedEx	https://www.fedex.com/fedextrack/?trknbr=284021716082	2025-01-05 15:35:23	\N	delivered	2025-01-13 05:57:03	2025-04-24 22:19:52.912271	2025-04-28 18:55:59.378
149	SW-1444	6290032984395	Kerem Brule	kerembrule@gmail.com	+16195492924	255 Coltrane Court	Irvine	California	92617	United States	reseller	t	KEREM	delivered	2024-11-08 16:39:57	\N		0	{"key": "432 Hz", "type": "Innato Am3", "color": "Tiger with Golden Bubbles", "model": "INNATO"}	{}	\N	f	284021714723	FedEx	https://www.fedex.com/fedextrack/?trknbr=284021714723	2025-01-05 15:34:57	\N	delivered	2025-01-09 22:09:03	2025-04-24 22:19:53.878768	2025-04-28 18:56:00.228
151	SW-1442	6287789687115	Ivo Sedlacek	info@savita.cz	+420603481984	V Aleji 42	Jablonec nad Nisou	\N	466 01	Czech Republic	reseller	t	SAVITA	delivered	2024-11-07 08:53:55	\N		0	{"key": "Smoke fired Blue/ Red and Gold Bubbles", "type": "Innato flute", "color": "A - medium/ large hands", "model": "INNATO", "engraving": "No"}	{}	\N	f	\N	\N	\N	2024-12-07 15:11:14	\N	delivered	2024-12-07 15:11:14	2025-04-24 22:19:54.410191	2025-04-28 18:56:00.842
145	SW-1448	6298942112075	Stine Nerhus	stine.nerhus@hotmail.com	48182804	Skålagato 4	Rosendal	\N	5470	Norway	retail	f	\N	delivered	2024-11-13 18:10:29	\N		0	{"key": "Red with Gold Bubbles Smokefired", "type": "Natey flute", "color": "G4", "model": "NATEY"}	{}	\N	f	LA100580926NL	PostNL Domestic	https://jouw.postnl.nl/track-and-trace/	\N	\N	delivered	2025-01-12 15:44:13	2025-04-24 22:19:52.608472	2025-04-24 22:21:24.941
139	SW-1454	6300908192075	Elijah Spiros	elijahxspiros@gmail.com	3144033120	2024 Clermont Crossing Drive, Apartment L	St. Louis	Missouri	63146	United States	retail	f	\N	delivered	2024-11-15 03:01:36	\N		0	{"type": "ZENflute", "color": "Large - E3", "model": "ZEN"}	{}	\N	f	283022046590	FedEx	https://www.fedex.com/fedextrack/?trknbr=283022046590	2024-12-10 20:32:36	\N	delivered	2024-12-12 16:03:12	2025-04-24 22:19:50.863959	2025-04-24 22:20:26.959
140	SW-1453	6300889841995	Robert Phillips	bprawore@gmail.com	5035155587	2009 Ne Brazee St	Portland	Oregon	97212	United States	retail	f	\N	delivered	2024-11-15 01:31:47	\N		0	{"type": "ZENflute", "color": "Medium - G3", "model": "ZEN"}	{}	\N	f	284021713289	FedEx	https://www.fedex.com/fedextrack/?trknbr=284021713289	2025-01-05 15:33:54	\N	delivered	2025-01-10 01:12:04	2025-04-24 22:19:51.10792	2025-04-24 22:20:27.636
141	SW-1452	6300716433739	Sophie Gallez	sophie.gallez.be@gmail.com	+32472251037	rue de la Belle Haie 40	Court-Saint-Etienne	\N	1490	Belgium	retail	f	\N	delivered	2024-11-14 20:55:04	\N		0	{"type": "ZENflute", "color": "Medium - G3", "model": "ZEN"}	{}	\N	f	05112925387148	DPD Germany	https://tracking.dpd.de/status/de_DE/parcel/05112925387148	2025-01-05 15:32:56	\N	delivered	2025-01-05 15:39:08	2025-04-24 22:19:51.406789	2025-04-24 22:20:28.3
143	SW-1450	6299348697419	Kevin Robertson	thebeast7991@gmail.com	5105528751	420 Decatur, Apt 3f	Brooklyn	New York	11233	United States	retail	f	\N	delivered	2024-11-13 23:04:51	\N		0	{"type": "ZENflute", "color": "Medium - G3", "model": "ZEN"}	{}	\N	f	284021715362	FedEx	https://www.fedex.com/fedextrack/?trknbr=284021715362	2025-01-05 15:33:34	\N	delivered	2025-01-09 20:00:05	2025-04-24 22:19:52.01135	2025-04-24 22:20:29.803
144	SW-1449	6299271790923	Oliver Raetz	oraetz5@gmail.com	3608393709	2115 east 32nd street	Vancouver	Washington	98663	United States	retail	f	\N	delivered	2024-11-13 21:38:08	\N		0	{"type": "ZENflute", "color": "Medium - G3", "model": "ZEN"}	{}	\N	f	284021716347	FedEx	https://www.fedex.com/fedextrack/?trknbr=284021716347	2025-01-05 15:33:17	\N	delivered	2025-01-09 19:02:04	2025-04-24 22:19:52.30971	2025-04-24 22:20:30.534
148	SW-1445	6292656193867	Pierre Spiridon	spiridonpierre@gmail.com	0709935444	Södergatan 15B, 15b	Märsta	\N	195 47	Sweden	retail	f	\N	delivered	2024-11-10 02:35:40	\N		0	{"key": "Black with red/ Copper Bubble Smokefired", "type": "Natey flute", "color": "Bb3", "model": "NATEY", "tuning": "432 Hz", "tuningFrequency": "432 Hz"}	{}	\N	f	05112925386552	DPD Germany	https://tracking.dpd.de/status/de_DE/parcel/05112925386552	\N	\N	delivered	2024-12-17 20:32:17	2025-04-24 22:19:53.636277	2025-04-24 22:21:25.883
150	SW-1443	6288992403787	Boudy Verleye	boudy.verleye@hotmail.com	+32472762519	Gallaitstraat 88	Schaarbeek	\N	1030	Belgium	retail	f	\N	delivered	2024-11-08 00:29:57	\N		0	{"key": "Blue/ Red and Gold Bubbles", "type": "Innato flute", "color": "C - medium hands", "model": "INNATO", "engraving": "No"}	{}	\N	f	05112925387152	DPD Germany	https://tracking.dpd.de/status/de_DE/parcel/05112925387152	2025-01-05 15:34:36	\N	delivered	2025-01-05 15:39:56	2025-04-24 22:19:54.114842	2025-04-24 22:20:34.867
152	SW-1441	6286787248459	Remy Scheelings	regenboogweer@gmail.com	0630088100	2A Costerlaan, A	Zeist	\N	3701 JM	Netherlands	retail	f	\N	delivered	2024-11-06 14:36:47	\N		0	{"key": "Blue/ Red and Gold Bubbles", "type": "Innato flute", "color": "Bb - medium/ large hands", "model": "INNATO", "engraving": "No"}	{}	\N	f	05112925387153	DPD Germany	https://tracking.dpd.de/status/de_DE/parcel/05112925387153	2025-01-05 15:34:16	\N	delivered	2025-01-05 15:39:35	2025-04-24 22:19:56.969934	2025-04-24 22:20:36.671
154	SW-1439	6285886849355	Alexandr Aizelman	7751069@gmail.com	+36303812177	Rumbach Sebestyen 12	Budapest	\N	1075	Hungary	retail	f	\N	delivered	2024-11-05 21:21:25	\N		0	{"key": "Smokefired black/ Red and Copper Bubbles", "type": "Innato flute", "color": "A - medium/ large hands", "model": "INNATO", "engraving": "No"}	{}	\N	f	5112925386551	FedEx	https://www.fedex.com/fedextrack/?trknbr=5112925386551	2024-12-10 20:31:37	\N	delivered	2024-12-10 20:31:38	2025-04-24 22:19:57.500341	2025-04-24 22:20:38.08
155	SW-1438	6281765257547	Sally Wilson	sally@bodytranquility.co.uk	07930471919	The Bibbery, Higher Bibbery	Bovey Tracey	England	TQ13 9ET	United Kingdom	retail	f	\N	delivered	2024-11-03 07:44:02	\N		0	{"key": "Smoke fired Blue/ Red and Gold Bubbles", "type": "Innato flute", "color": "B - medium hands", "model": "INNATO", "engraving": "No"}	{}	\N	f	283022036177	FedEx	https://www.fedex.com/fedextrack/?trknbr=283022036177	2024-12-10 20:31:10	\N	delivered	2024-12-13 09:46:14	2025-04-24 22:19:57.860099	2025-04-24 22:20:38.722
156	SW-1437	6280455946571	AK K	ak.tech.sg@gmail.com	84252292	117 Pasir Ris Grove, 01-55	Singapore	\N	518173	Singapore	retail	f	\N	delivered	2024-11-02 08:36:27	\N		0	{"key": "Smoke fired Tiger Red", "type": "Innato flute", "color": "A - medium/ large hands", "model": "INNATO", "engraving": "No"}	{}	\N	f	\N	\N	\N	2025-04-20 20:28:50	\N	delivered	2025-04-20 20:28:50	2025-04-24 22:19:58.105114	2025-04-24 22:20:39.383
157	SW-1436	6276263543115	Lorraine Johnson	lorblas0609@att.net	7138246106	3504 BELMORE LANE	PEARLAND	Texas	77584	United States	retail	f	\N	delivered	2024-10-30 14:33:43	\N		0	{"key": "Blue with Red/Gold Bubbles Smokefired", "type": "Natey flute", "color": "F4", "model": "NATEY", "tuning": "432 Hz", "tuningFrequency": "432 Hz"}	{}	\N	f	283022018616	FedEx	https://www.fedex.com/fedextrack/?trknbr=283022018616	2024-12-10 20:28:47	\N	delivered	2024-12-14 18:02:06	2025-04-24 22:19:58.341008	2025-04-24 22:20:40.054
158	SW-1435	6273975058763	Adrien Maillefer	a.maillefer1317@gmail.com	01729361617	Kirchstrasse 8	Swisttal	\N	53913	Germany	retail	f	\N	delivered	2024-10-28 19:30:11	\N		0	{"key": "Smoke fired Blue/ Red and Gold Bubbles", "type": "Innato flute", "color": "C - medium hands", "model": "INNATO", "engraving": "No"}	{}	\N	f	\N	\N	\N	2025-04-20 20:28:20	\N	delivered	2025-04-20 20:28:20	2025-04-24 22:19:58.577203	2025-04-24 22:20:40.662
174	SW-1419	6230417965387	Ivo Sedlacek	info@savita.cz	+420603481984	V Aleji 42	Jablonec nad Nisou	\N	466 01	Czech Republic	reseller	t	SAVITA	delivered	2024-10-03 08:35:50	\N		0	{"key": "Blue/ Red and Gold Bubbles", "type": "Innato flute", "color": "D - small hands", "model": "INNATO", "engraving": "No"}	{}	\N	f	\N	\N	\N	2024-10-29 06:16:03	\N	delivered	2024-10-29 06:16:03	2025-04-24 22:20:03.197033	2025-04-28 19:18:02.064
163	SW-1430	6256834117963	Canan Kurban	canan.kurban@web.de	+4915115669829	Ulrich-Willer-Strasse 22	Marktheidenfeld	\N	97828	Germany	retail	f	\N	delivered	2024-10-17 17:24:17	\N		0	{"key": "Smoke fired Blue/ Red and Gold Bubbles", "type": "Innato flute", "color": "C - medium hands", "model": "INNATO", "engraving": "No"}	{}	\N	f	283022024195	FedEx	https://www.fedex.com/fedextrack/?trknbr=283022024195	\N	\N	delivered	2024-12-24 20:29:36	2025-04-24 22:19:59.879696	2025-04-24 22:21:28.3
161	SW-1432	6260864352587	Mia Malcyone	mia@ecospace.se	+46707515776	Synålsvägen 21	Bromma	\N	168 73	Sweden	retail	f	\N	delivered	2024-10-20 21:04:04	\N		0	{"key": "Red with Gold Bubble Smokefired", "type": "Natey flute", "color": "A4", "model": "NATEY", "tuning": "440 Hz", "tuningFrequency": "440 Hz"}	{}	\N	f	\N	\N	\N	2025-04-20 20:28:06	\N	delivered	2025-04-20 20:28:06	2025-04-24 22:19:59.28223	2025-04-24 22:20:42.652
168	SW-1425	6248557281611	Rebecca Dunaway	\N	+16143291144	1104 Lincoln Road	Columbus	Ohio	43212	United States	retail	f	\N	delivered	2024-10-12 17:03:42	\N		0	{"key": "Smoke fired Tiger Red", "type": "Innato flute", "color": "E - small hands", "model": "INNATO", "engraving": "No"}	{}	\N	f	281898283263	FedEx	https://www.fedex.com/fedextrack/?trknbr=281898283263	\N	\N	delivered	2024-12-01 20:08:30	2025-04-24 22:20:01.079748	2025-04-24 22:21:29.757
164	SW-1429	6250296475979	Gregor Reißmüller	g.reissmueller@gmx.de	01797905492	Am Kirchdorfer Moor 32	Aurich	\N	26605	Germany	retail	f	\N	delivered	2024-10-13 20:16:15	\N		0	{"key": "Smokefired black/ Red and Copper Bubbles", "type": "Innato flute", "color": "A - medium/ large hands", "model": "INNATO", "engraving": "No"}	{}	\N	f	283022022550	FedEx	https://www.fedex.com/fedextrack/?trknbr=283022022550	2024-12-10 20:29:14	\N	delivered	2024-12-12 12:33:07	2025-04-24 22:20:00.114079	2025-04-24 22:20:44.927
165	SW-1428	6250214457675	Simon Gerhards	simon-gerhards@gmx.de	+4917670265424	Untere Dorfstraße 142	Riethnordhausen	\N	99195	Germany	retail	f	\N	delivered	2024-10-13 19:18:36	\N		0	{"key": "Black with Red/Copper bubbles Smokefired", "type": "Natey flute", "color": "F4", "model": "NATEY", "tuning": "432 Hz", "tuningFrequency": "432 Hz"}	{}	\N	f	05112925385842	DPD Germany	https://tracking.dpd.de/status/de_DE/parcel/05112925385842	2024-11-17 20:09:06	\N	delivered	2024-11-17 20:09:06	2025-04-24 22:20:00.355542	2025-04-24 22:20:45.535
166	SW-1427	6249680404811	Janaki Anderson	andersonnn.x@hotmail.com	07555188457	6 Hartswood Close	Hertsmere	England	WD23 2GB	United Kingdom	retail	f	\N	shipping	2024-10-13 13:20:01	\N		0	{"key": "Black with Red/Copper bubbles Smokefired", "type": "Natey flute", "color": "G#4", "model": "NATEY", "tuning": "440 Hz", "tuningFrequency": "440 Hz"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-04-24 22:20:00.591684	2025-04-24 22:20:46.282
179	SW-1414	6223965094219	Nicole Cowans	cowansnm@gmail.com	8043579985	12400 Richmond Street	Chester	Virginia	23831	United States	retail	f	\N	delivered	2024-09-28 14:59:01	\N		0	{"key": "Blue/ Red and Gold Bubbles", "type": "Innato flute", "color": "Bb - medium/ large hands", "model": "INNATO", "tuning": "432 Hz", "tuningFrequency": "432 Hz"}	{}	\N	f	 280577270547	FedEx	https://www.fedex.com/fedextrack/?trknbr=280577270547	\N	\N	delivered	2024-10-27 14:32:15	2025-04-24 22:20:05.064611	2025-04-24 22:21:32.305
169	SW-1424	6247445627211	Margaret Ross	marg_dell@hotmail.com	+61417573125	2708N/883 Collins Street	Docklands	Victoria	3008	Australia	retail	f	\N	delivered	2024-10-11 21:03:04	\N		0	{"key": "Smoke fired Blue/ Red and Gold Bubbles", "type": "Innato flute", "color": "Bb - medium/ large hands", "model": "INNATO", "engraving": "No"}	{}	\N	f	281897667490	FedEx	https://www.fedex.com/fedextrack/?trknbr=281897667490	2024-11-17 20:02:22	\N	delivered	2024-11-27 04:01:06	2025-04-24 22:20:01.34019	2025-04-24 22:20:48.209
170	SW-1423	6244497719627	Logan Brown	\N	+13309071321	635 24th St NW	Massillon	Ohio	44647	United States	retail	f	\N	delivered	2024-10-09 20:50:19	\N		0	{"type": "ZENflute", "color": "Medium - G3", "model": "ZEN"}	{}	\N	f	281897666839	FedEx	https://www.fedex.com/fedextrack/?trknbr=281897666839	2024-11-17 20:01:40	\N	delivered	2024-11-25 19:30:07	2025-04-24 22:20:01.577477	2025-04-24 22:20:48.826
171	SW-1422	6241873363275	Andrea Bertucci	abertucci27@gmail.com	3016333499	31-76 36th Street, 1F	Long Island City	New York	11106	United States	retail	f	\N	delivered	2024-10-08 00:19:31	\N	If possible and not too much to ask could you put an Om symbol discretely. If not possible, no worries. :)	0	{"key": "Blue/ Red and Gold Bubbles", "type": "Innato flute", "color": "E - small hands", "model": "INNATO", "engraving": "No"}	{}	\N	f	281897666530	FedEx	https://www.fedex.com/fedextrack/?trknbr=281897666530	2024-11-17 20:03:06	\N	delivered	2024-11-23 16:24:08	2025-04-24 22:20:01.812282	2025-04-24 22:20:49.498
172	SW-1421	6241402683723	Alan Tower	alan@theresonancecenter.com	\N	2045 Meridian Avenue, Apt A	South Pasadena	California	91030	United States	retail	f	\N	delivered	2024-10-07 15:49:49	\N		0	{"key": "Smoke fired Tiger Red", "type": "Innato flute", "color": "E - small hands", "model": "INNATO", "engraving": "No"}	{}	\N	f	\N	\N	\N	2024-11-17 20:42:29	\N	delivered	2024-11-17 20:42:29	2025-04-24 22:20:02.054289	2025-04-24 22:20:50.308
173	SW-1420	6231820992843	Lucas Pizzini	\N	+33608473633	74 Rue Charles Longuet	Saint-Nazaire	\N	44600	France	retail	f	\N	delivered	2024-10-03 19:47:07	\N		0	{"key": "Red with Gold Bubble Smokefired", "type": "Natey flute", "color": "A4", "model": "NATEY"}	{}	\N	f	\N	\N	\N	2025-04-20 20:27:24	\N	delivered	2025-04-20 20:27:24	2025-04-24 22:20:02.952348	2025-04-24 22:20:51.039
175	SW-1418	6229748810059	Clément CRESSIOT	clement.cressiot@gmail.com	0663943076	31 Rue de Maison Rouge	Gagny	\N	93220	France	retail	f	\N	delivered	2024-10-02 17:07:41	\N		0	{"type": "ZENflute", "color": "Medium - G3", "model": "ZEN"}	{}	\N	f	281897666118	FedEx	https://www.fedex.com/fedextrack/?trknbr=281897666118	2024-11-17 19:58:05	\N	delivered	2024-11-20 17:40:11	2025-04-24 22:20:03.978532	2025-04-24 22:20:52.59
178	SW-1415	6224370073931	Karen Bader	\N	+15135457121	662 Woodfield Drive	Lewis Center	Ohio	43035	United States	retail	f	\N	shipping	2024-09-28 20:38:18	\N		0	{"key": "Smokefired black/ Red and Copper Bubbles", "type": "Innato flute", "color": "Bb - medium/ large hands", "model": "INNATO", "tuning": "432 Hz", "tuningFrequency": "432 Hz"}	{}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-04-24 22:20:04.828951	2025-04-24 22:20:54.584
180	SW-1413	6222969864523	Sara Rosario Valenzuela	\N	+34671015578	Calle Lorenzo Leal 7, 2ºD	Sevilla	Sevilla	41010	Spain	retail	f	\N	delivered	2024-09-27 20:49:38	\N		0	{"type": "ZENflute", "color": "Medium - G3", "model": "ZEN"}	{}	\N	f	281898283127	FedEx	https://www.fedex.com/fedextrack/?trknbr=281898283127	2024-11-17 20:07:52	\N	delivered	2024-11-21 10:59:05	2025-04-24 22:20:05.301409	2025-04-24 22:20:55.808
181	SW-1412	6222397735243	Iris Johner	irisjohner@gmail.com	+351925280190	C/O Benny Sommer, Rua da Nora, edificio Solimar, apartamento 2B	Burgau	Faro	8650-108	Portugal	retail	f	\N	delivered	2024-09-27 13:14:27	\N		0	{"key": "Blue/ Red and Gold Bubbles", "type": "Innato flute", "color": "A - medium/ large hands", "model": "INNATO"}	{}	\N	f	05112925385841	DPD Germany	https://tracking.dpd.de/status/de_DE/parcel/05112925385841	2024-11-17 20:07:07	\N	delivered	2024-11-17 20:07:07	2025-04-24 22:20:05.542216	2025-04-24 22:20:56.447
185	SW-1408	6221307740491	Kerem Brule	kerembrule@gmail.com	+16195492924	3747 9th Ave SW	Rochester	Minnesota	55902	United States	reseller	t	KEREM	delivered	2024-09-26 15:34:30	\N		0	{"key": "Smoke fired Tiger Red", "type": "Innato flute", "color": "C - medium hands", "model": "INNATO", "tuning": "432 Hz", "engraving": "No", "tuningFrequency": "432 Hz"}	{}	\N	f	281373394461	FedEx	https://www.fedex.com/fedextrack/?trknbr=281373394461	2024-11-05 08:50:36	\N	delivered	2024-11-06 20:10:04	2025-04-24 22:20:06.562477	2025-04-28 19:18:05.074
110	SW-1483	6355096535371	Timothy Shyne	timshyne@gmail.com	6122424726	214 Kili'o'opu Street	Wailuku	Hawaii	96793	United States	retail	f	\N	delivered	2024-12-02 20:47:11	\N		0	{"key": "432 Hz", "type": "Innato Bm3", "color": "Blue, with Terra and Gold Bubbles", "model": "INNATO"}	{}	\N	f	286663030370	FedEx	https://www.fedex.com/fedextrack/?trknbr=286663030370	2025-03-20 21:02:49	\N	delivered	2025-03-26 18:46:06	2025-04-24 22:19:43.178686	2025-04-24 22:20:06.918
114	SW-1479	6352523526475	Alon Lipelis	alon.lipelis@gmail.com	0547405113	Haruv 14, 1	Haifa	\N	3432618	Israel	retail	f	\N	delivered	2024-12-01 20:49:34	\N		0	{"key": "440 Hz", "type": "Innato Em4", "color": "Smokefired Blue with Red and Bronze Bubbles", "model": "INNATO"}	{}	\N	f	286216027881	FedEx	https://www.fedex.com/fedextrack/?trknbr=286216027881	2025-03-08 19:49:19	\N	delivered	2025-03-16 17:28:03	2025-04-24 22:19:44.147462	2025-04-24 22:20:09.693
190	SW-1403	6204560539979	Monica McTaggart	mmctaggart@hotmail.com	+61410454263	23B Seaforth Rd	Shoalwater	Western Australia	6169	Australia	retail	f	\N	delivered	2024-09-16 06:50:58	\N		0	{"key": "Blue/ Red and Gold Bubbles", "type": "Innato flute", "color": "A - medium/ large hands", "model": "INNATO", "tuning": "432 Hz", "tuningFrequency": "432 Hz"}	{}	\N	f	281897666910	FedEx	https://www.fedex.com/fedextrack/?trknbr=281897666910	2024-11-17 20:00:52	\N	delivered	2024-11-27 03:42:32	2025-04-24 22:20:07.739311	2025-04-24 22:21:33.67
183	SW-1410	6221508673867	Almir Cremers	almir2u@gmail.com	+31622777213	Wertemerweg 10	Evertsoord	\N	5977 ND	Netherlands	retail	f	\N	delivered	2024-09-26 18:28:17	\N		0	{"key": "Smokefired black/ Red and Copper Bubbles", "type": "Innato flute", "color": "C# - small/ medium hands", "model": "INNATO", "tuning": "440 Hz", "tuningFrequency": "440 Hz"}	{}	\N	f	\N	\N	\N	2024-11-17 20:40:25	\N	delivered	2024-11-17 20:40:25	2025-04-24 22:20:06.026199	2025-04-24 22:20:57.795
184	SW-1409	6221341294923	James Davis	jamesdavis66@hotmail.co.uk	+31683513859	102 Aert van Neslaan	Oegstgeest	\N	2341 HH	Netherlands	retail	f	\N	delivered	2024-09-26 16:01:26	\N		0	{"key": "Red with Gold Bubble Smokefired", "type": "Natey flute", "color": "C4", "model": "NATEY"}	{}	\N	f	05112925383514	DPD Germany	https://tracking.dpd.de/status/de_DE/parcel/05112925383514	2024-10-13 14:33:52	\N	delivered	2024-10-13 14:33:52	2025-04-24 22:20:06.324371	2025-04-24 22:20:58.501
187	SW-1406	6216688206155	Katharina Peters	katharina@daaura-management.com	+4917620239819	Kestnerstraße 12, Südstadt-Bult	Hannover	\N	30159	Germany	retail	f	\N	delivered	2024-09-23 12:58:09	\N		0	{"key": "Blue/ Red and Gold Bubbles", "type": "Innato flute", "color": "E - small hands", "model": "INNATO", "tuning": "432 Hz", "tuningFrequency": "432 Hz"}	{}	\N	f	05112925385840	DPD Germany	https://tracking.dpd.de/status/de_DE/parcel/05112925385840	2024-11-17 20:06:29	\N	delivered	2024-11-17 20:06:29	2025-04-24 22:20:07.033742	2025-04-24 22:21:00.37
188	SW-1405	6214148063563	George Browne	luzialessandra@googlemail.com	07771578694	Thames Wharf Studios	London	England	W6 9HA	United Kingdom	retail	f	\N	delivered	2024-09-21 11:32:58	\N		0	{"key": "Smoke fired Tiger Red", "type": "Innato flute", "color": "E - small hands", "model": "INNATO", "tuning": "440 Hz", "engraving": "No", "tuningFrequency": "440 Hz"}	{}	\N	f	281897845056	FedEx	https://www.fedex.com/fedextrack/?trknbr=281897845056	2024-11-17 20:05:34	\N	delivered	2024-11-20 15:31:10	2025-04-24 22:20:07.269118	2025-04-24 22:21:01.025
191	SW-1402	6203125989707	Julian Rudolph	juli.rudolph@gmail.com	00436642014901	Herrengasse 30	Satteins	\N	6822	Austria	retail	f	\N	delivered	2024-09-15 00:43:41	\N		0	{"key": "Black with Red/Copper bubbles Smokefired", "type": "Natey flute", "color": "A4", "model": "NATEY"}	{}	\N	f	05112925385573	DPD Germany	https://tracking.dpd.de/status/de_DE/parcel/05112925385573	2024-11-05 08:49:40	\N	delivered	2024-11-05 08:49:40	2025-04-24 22:20:07.977079	2025-04-24 22:21:34.385
192	SW-1401	6203116355915	Axel Albin-Lax	axel.albinlax@gmail.com	+14153367667	2461 East Calle Sin Controversia	Tucson	Arizona	85718	United States	retail	f	\N	delivered	2024-09-14 23:46:40	\N		0	{"key": "Blue/ Red and Gold Bubbles", "type": "Innato flute", "color": "D - small hands", "model": "INNATO", "tuning": "440 Hz", "tuningFrequency": "440 Hz"}	{}	\N	f	281373347000	FedEx	https://www.fedex.com/fedextrack/?trknbr=281373347000	2024-11-05 08:50:14	\N	delivered	2024-11-06 19:55:06	2025-04-24 22:20:08.234047	2025-04-24 22:21:35.046
193	SW-1400	6200007885131	Samuel Lashells	samuel.lashells@gmail.com	+17573760320	3557 Calverton Way	Chesapeake	Virginia	23321	United States	retail	f	\N	delivered	2024-09-13 02:28:26	\N		0	{"key": "Smoke fired Blue/ Red and Gold Bubbles", "type": "Innato flute", "color": "Bb - medium/ large hands", "model": "INNATO", "tuning": "432 Hz", "tuningFrequency": "432 Hz"}	{}	\N	f	 281373288165	FedEx	https://www.fedex.com/fedextrack/?trknbr=281373288165	2024-11-05 08:47:24	\N	delivered	2024-11-06 20:10:05	2025-04-24 22:20:08.536717	2025-04-24 22:21:35.734
194	SW-1399	6199977378123	Nicky Dorrington	yahneddy@yahoo.co.uk	07718900747	59 Bury Road	Thetford	England	IP24 3DD	United Kingdom	retail	f	\N	delivered	2024-09-12 23:18:48	\N		0	{"key": "Blue with Red/Gold Bubbles Smokefired", "type": "Natey flute", "color": "C4", "model": "NATEY"}	{}	\N	f	281897844440	FedEx	https://www.fedex.com/fedextrack/?trknbr=281897844440	2024-11-17 20:04:51	\N	delivered	2024-11-20 12:02:51	2025-04-24 22:20:08.783673	2025-04-24 22:21:36.409
195	SW-1398	6199915839819	Flavia Gallo	flavia.gallo1997@gmail.com	+393333441146	Corso Vittorio Emanuele II 192	Torino	Torino	10138	Italy	retail	f	\N	delivered	2024-09-12 21:02:20	\N		0	{"type": "ZENflute", "color": "Medium - G3", "model": "ZEN"}	{}	\N	f	281373284961	FedEx	https://www.fedex.com/fedextrack/?trknbr=281373284961	2024-11-05 08:47:53	\N	delivered	2024-11-07 11:53:05	2025-04-24 22:20:09.040549	2025-04-24 22:21:37.066
197	SW-1396	6194516230475	Mala Eggers	malaeggers@hotmail.com	+4561672433	Egilsgade 3, 5 tv	København S	\N	2300	Denmark	retail	f	\N	delivered	2024-09-08 19:12:57	\N		0	{"key": "Red with Gold Bubbles Smokefired", "type": "Double flute", "color": "Medium B Native", "model": "DOUBLE"}	{}	\N	f	05112925385572	DPD Germany	https://tracking.dpd.de/status/de_DE/parcel/05112925385572	2024-11-05 08:46:46	\N	delivered	2024-11-05 08:46:46	2025-04-24 22:20:09.555644	2025-04-24 22:21:38.468
199	SW-1394	6190945370443	Matt Schara	m_schara@yahoo.com	+13192171563	4002 Sycamore Drive	Mount Pleasant	Iowa	52641	United States	retail	f	\N	delivered	2024-09-06 03:10:20	\N		0	{"key": "G - large hands", "type": "Innato flute", "color": "Smoke fired Blue/ Red and Gold Bubbles", "model": "INNATO", "tuning": "432 Hz", "tuningFrequency": "432 Hz"}	{}	\N	f	280577859207	FedEx	https://www.fedex.com/fedextrack/?trknbr=280577859207	2024-10-13 15:07:32	\N	delivered	2025-04-23 22:32:42.41	2025-04-24 22:20:10.038998	2025-04-24 22:32:51.221
214	SW-1379	6167004348747	Onetone USA	onetonesonicalchemy@gmail.com	+15053635646	2541 Elfego Rd NW	Albuquerque	New Mexico	87107	United States	reseller	t	ONETONE	delivered	2024-08-20 15:43:38	\N		0	{"key": "C# - small/ medium hands", "type": "Innato flute", "color": "Blue/ Red and Gold Bubbles", "model": "INNATO", "tuning": "432 Hz", "tuningFrequency": "432 Hz"}	{}	\N	f	280577254047	FedEx	https://www.fedex.com/fedextrack/?trknbr=280577254047	2024-10-13 14:37:54	\N	processing	\N	2025-04-24 22:20:13.71661	2025-04-28 19:19:13.425
219	SW-1374	6154642587979	Kerem Brule	kerembrule@gmail.com	+16195492924	1326 Arch Street	Berkeley	California	94708	United States	reseller	t	KEREM	delivered	2024-08-13 22:21:23	\N	Drop Ship for Beautiful Sounds	0	{"key": "black with Gold Bubbles", "type": "Innato flute", "color": "Smoke fired Tiger Red", "model": "INNATO", "tuning": "432 Hz", "engraving": "No", "tuningFrequency": "432 Hz"}	{}	\N	f	280352599924	FedEx	https://www.fedex.com/fedextrack/?trknbr=280352599924	2024-10-07 18:33:05	\N	processing	\N	2025-04-24 22:20:14.974545	2025-04-28 19:19:14.789
202	SW-1391	6188710920523	Anita Wolsink	mjbaan90@gmail.com	0642054320	Coehoornstraat, 19	Arnhem	\N	6811 LA	Netherlands	retail	f	\N	delivered	2024-09-04 15:14:04	\N		0	{"key": "E - small hands", "type": "Innato flute", "color": "Smoke fired Blue/ Red and Gold Bubbles", "model": "INNATO"}	{}	\N	f	05112925389746	DPD	https://tracking.dpd.de/parcel/05112925389746	2024-11-17 20:39:48	2025-04-29 22:32:43.93	in_transit	\N	2025-04-24 22:20:10.812403	2025-04-24 22:32:51.404
203	SW-1390	6188694176075	Kali and Holden Cirque	\N	+12074159329	1000 4th Avenue West North	Columbia Falls	Montana	59912	United States	retail	f	\N	delivered	2024-09-04 15:02:14	\N		0	{"key": "Red with Gold Bubble Smokefired", "type": "Natey flute", "color": "F4", "model": "NATEY"}	{}	\N	f	280577266165	FedEx	https://www.fedex.com/fedextrack/?trknbr=280577266165	2024-10-13 14:34:14	\N	processing	\N	2025-04-24 22:20:11.04844	2025-04-24 22:32:51.464
205	SW-1388	6182468976971	Karina Bartczak	karinabartczak@gmail.com	07947 569646	6 Flatsheet Rd	Aylesham	England	CT3 3GL	United Kingdom	retail	f	\N	delivered	2024-08-31 08:02:40	\N		0	{"type": "ZENflute", "color": "Medium - G3", "model": "ZEN"}	{}	\N	f	280577264416	FedEx	https://www.fedex.com/fedextrack/?trknbr=280577264416	2024-10-13 14:34:54	\N	delivered	2025-04-22 22:32:43.932	2025-04-24 22:20:11.518715	2025-04-24 22:32:51.596
206	SW-1387	6178154807627	Alan Tower	alan@theresonancecenter.com	\N	2045 Meridian Avenue, Apt A	South Pasadena	California	91030	United States	retail	f	\N	delivered	2024-08-27 21:55:23	\N		0	{"key": "black with Gold Bubbles", "type": "Innato flute", "color": "Smoke fired Tiger Red", "model": "INNATO", "engraving": "No"}	{}	\N	f	280577260487	FedEx	https://www.fedex.com/fedextrack/?trknbr=280577260487	2024-10-13 14:35:15	\N	delivered	2025-04-23 22:32:43.934	2025-04-24 22:20:11.752826	2025-04-24 22:32:51.656
207	SW-1386	6177416872267	Aurora Belli	aurora.belli.studenti@ababo.it	+31648283915	Mezquitalaan 112	Amsterdam	\N	1064 NS	Netherlands	retail	f	\N	delivered	2024-08-27 12:03:33	\N		0	{"key": "Black with Red/Copper bubbles Smokefired", "type": "Natey flute", "color": "D4", "model": "NATEY"}	{}	\N	f	05112925383426	DPD Germany	https://tracking.dpd.de/status/de_DE/parcel/05112925383426	2024-10-07 18:34:10	2025-04-29 22:32:43.934	in_transit	\N	2025-04-24 22:20:12.04733	2025-04-24 22:32:51.716
209	SW-1384	6174621892939	Anna Nester	anna-lino@hotmail.de	017699288616	Lübecker Str. 53	Bad Segeberg	\N	23795	Germany	retail	f	\N	delivered	2024-08-25 14:21:52	\N		0	{"key": "Black with Red/Copper bubbles Smokefired", "type": "Natey flute", "color": "G#4", "model": "NATEY", "tuning": "432 Hz", "tuningFrequency": "432 Hz"}	{}	\N	f	05112925383512	DPD Germany	https://tracking.dpd.de/status/de_DE/parcel/05112925383512	2024-10-13 14:36:07	\N	processing	\N	2025-04-24 22:20:12.52745	2025-04-24 22:32:51.84
210	SW-1383	6174064542027	Kate  Locastro	kebeel@gmail.com	0433489368	6 Stock Court	Donvale	Victoria	3111	Australia	retail	f	\N	delivered	2024-08-25 08:06:13	\N		0	{"key": "Bb - medium/ large hands", "type": "Innato flute", "color": "Smokefired black/ Red and Copper Bubbles", "model": "INNATO", "tuning": "440 Hz", "tuningFrequency": "440 Hz"}	{}	\N	f	280577259370	FedEx	https://www.fedex.com/fedextrack/?trknbr=280577259370	2024-10-13 14:36:28	2025-04-29 22:32:43.935	in_transit	\N	2025-04-24 22:20:12.76741	2025-04-24 22:32:51.9
212	SW-1381	6169132499275	Zach Veenstra	zach.veen.gr@gmail.com	+16168217098	850 Maple Hill Ct SE	Ada	Michigan	49301	United States	retail	f	\N	delivered	2024-08-21 23:16:48	\N		0	{"key": "Bb - medium/ large hands", "type": "Innato flute", "color": "Smoke fired Blue/ Red and Gold Bubbles", "model": "INNATO", "tuning": "440 Hz", "tuningFrequency": "440 Hz"}	{}	\N	f	280577256061	FedEx	https://www.fedex.com/fedextrack/?trknbr=280577256061	2024-10-13 14:37:11	\N	delivered	2025-04-24 22:32:43.936	2025-04-24 22:20:13.242231	2025-04-24 22:32:52.03
213	SW-1380	6167586734411	Rumiko Yoshikawa	lumitan@icloud.com	08043599393	6 Nishi-Daiku Machi	Wakayama ken Wakayama city	Wakayama	640-8037	Japan	retail	f	\N	delivered	2024-08-21 02:37:38	\N		0	{"key": "E - small hands", "type": "Innato flute", "color": "Smoke fired Tiger Red/ Black no Bubbles", "model": "INNATO"}	{}	\N	f	280577253198	FedEx	https://www.fedex.com/fedextrack/?trknbr=280577253198	2024-10-13 14:37:31	2025-04-28 22:32:43.937	in_transit	\N	2025-04-24 22:20:13.476544	2025-04-24 22:32:52.097
216	SW-1377	6162448351563	Marlene Bochatay	mabochatay@netplus.ch	0244714030	Chemin du Grand-Clos 52	Massongex	\N	1869	Switzerland	retail	f	\N	delivered	2024-08-17 16:13:23	\N		0	{"key": "Black with Red/Copper bubbles Smokefired", "type": "Natey flute", "color": "A4", "model": "NATEY", "tuning": "432 Hz", "tuningFrequency": "432 Hz"}	{}	\N	f	280352625020	FedEx	https://www.fedex.com/fedextrack/?trknbr=280352625020	2024-10-07 18:33:43	2025-04-29 22:32:43.937	in_transit	\N	2025-04-24 22:20:14.200743	2025-04-24 22:32:52.218
218	SW-1375	6156179407179	Jenna Rainey	jenna@jennarainey.com	+13127197645	219 Lillian Place	Costa Mesa	California	92627	United States	retail	f	\N	delivered	2024-08-14 04:24:12	\N		0	{"key": "D - small hands", "type": "Innato flute", "color": "Smokefired black/ Red and Copper Bubbles", "model": "INNATO", "tuning": "440 Hz", "tuningFrequency": "440 Hz"}	{}	\N	f	280352611528	FedEx	https://www.fedex.com/fedextrack/?trknbr=280352611528	2024-10-07 18:33:25	2025-04-29 22:32:43.939	in_transit	\N	2025-04-24 22:20:14.734456	2025-04-24 22:32:52.346
220	SW-1373	6152550482251	Mourad Chouaki	mchouaki.epfl@gmail.com	+33782365299	7 Avenue du Parmelan	Annecy	\N	74000	France	retail	f	\N	delivered	2024-08-13 17:04:55	\N		0	{"key": "A - medium/ large hands", "type": "Innato flute", "color": "Smoke fired Blue/ Red and Gold Bubbles", "model": "INNATO", "tuning": "440 Hz", "tuningFrequency": "440 Hz"}	{}	\N	f	05112925383187	DPD Germany	https://tracking.dpd.de/status/de_DE/parcel/05112925383187	2024-09-23 13:12:24	\N	delivered	2025-04-24 22:32:43.94	2025-04-24 22:20:15.211311	2025-04-24 22:32:52.467
215	SW-1378	6166499557707	maria christina dreesmann	mariadreesmann.nl@gmail.com	644968730	Kerkplein 4	Bloemendaal	\N	2061 JC	Netherlands	retail	f	\N	ordered	2024-08-20 10:37:06	\N	77777	0	{"key": "Bb - medium/ large hands", "type": "Innato flute", "color": "Blue/ Red and Gold Bubbles", "model": "INNATO"}	{}	\N	t	\N	\N	\N	\N	\N	\N	\N	2025-04-24 22:20:13.953576	2025-04-24 22:25:11.757
116	SW-1477	6349513949515	Tatyana Kholodkov	mskholodkov@gmail.com	+18587612841	2303 Tampa Avenue	Durham	North Carolina	27705	United States	retail	f	\N	delivered	2024-11-30 18:03:19	\N		0	{"key": "440 Hz", "type": "Innato Cm4", "color": "Blue, with Terra and Gold Bubbles", "model": "INNATO"}	{}	\N	f	286216028476	FedEx	https://www.fedex.com/fedextrack/?trknbr=286216028476	2025-03-08 19:48:58	\N	delivered	2025-04-11 03:44:04	2025-04-24 22:19:44.628319	2025-04-24 22:20:11.045
119	SW-1474	6347731304779	Rachel Maiden	maiden1123@protonmail.com	+15092400127	307 South 9th Avenue, 279	Walla Walla	Washington	99362	United States	retail	f	\N	delivered	2024-11-30 02:04:14	\N		0	{"key": "432 Hz", "type": "Innato Cm4", "color": "Smokefired Blue with Red and Bronze Bubbles", "model": "INNATO"}	{}	\N	f	286216027138	FedEx	https://www.fedex.com/fedextrack/?trknbr=286216027138	2025-03-08 19:48:38	\N	delivered	2025-03-17 19:04:04	2025-04-24 22:19:45.350245	2025-04-24 22:20:13.112
125	SW-1468	6339741811019	Mary Ann Ubaldo	maubaldo@aol.com	7187067220	43-07 39th Place, Apt.5A	Sunnyside	New York	11104	United States	retail	f	\N	delivered	2024-11-27 19:02:10	\N		0	{"type": "Innato Exploration Cards", "model": "INNATO"}	{}	\N	f	LA133403566NL	PostNL Domestic	https://jouw.postnl.nl/track-and-trace/	2024-12-04 06:10:36	\N	delivered	2024-12-04 06:10:36	2025-04-24 22:19:46.864999	2025-04-24 22:20:17.359
128	SW-1465	6329680920907	Arnaud Pellerin	prikos.promo@wanadoo.fr	0033240542344	1 Rue Saint-Nicolas	Clisson	\N	44190	France	retail	f	\N	delivered	2024-11-25 09:09:50	\N	Hello, we had problem with a 'noisy overtone whistling' (not enough back pressure) on the last order and we had to send them back. \r\nPLease ask Hans to check the back pressure on this order. Thanks a lot for your help. Arnö	0	{"key": "432 Hz", "type": "Innato Am3", "color": "Blue, with Terra and Gold Bubbles", "model": "INNATO"}	{}	\N	f	286216029623	FedEx	https://www.fedex.com/fedextrack/?trknbr=286216029623	2025-03-08 19:50:28	\N	delivered	2025-03-12 09:00:06	2025-04-24 22:19:47.594898	2025-04-24 22:20:19.508
133	SW-1460	6307108421963	Sarah Davis	sarahjosephineartist@gmail.com	19188480985	17448 S. 642 RD	Wyandotte	Oklahoma	74370	United States	retail	f	\N	delivered	2024-11-19 04:21:50	\N		0	{"key": "Blue/ Red and Gold Bubbles", "type": "Innato flute", "color": "E - small hands", "model": "INNATO", "engraving": "No"}	{}	\N	f	286216031093	FedEx	https://www.fedex.com/fedextrack/?trknbr=286216031093	2025-03-08 19:51:30	\N	delivered	2025-03-17 20:14:05	2025-04-24 22:19:48.935473	2025-04-24 22:20:23.052
137	SW-1456	6302836785483	Emma Rehnberg	emma.rehnberg@hotmail.se	+46737152421	Hedtångsvägen 27	Hovås	\N	436 53	Sweden	retail	f	\N	delivered	2024-11-16 11:36:47	\N		0	{"key": "Smokefired black/ Red and Copper Bubbles", "type": "Innato flute", "color": "C - medium hands", "model": "INNATO", "engraving": "No"}	{}	\N	f	05112925387155	DPD Germany	https://tracking.dpd.de/status/de_DE/parcel/05112925387155	2025-01-05 15:36:08	\N	delivered	2025-01-05 15:41:09	2025-04-24 22:19:50.134273	2025-04-24 22:20:25.446
159	SW-1434	6271633097035	Lorenzo Andraghetti	andraghetti.l@gmail.com	+46793132358	Wollmar Yxkullsgatan 41D, Apt 1301 - doorcode 6996	Stockholm	\N	118 50	Sweden	retail	f	\N	delivered	2024-10-27 09:25:27	\N		0	{"key": "440 Hz", "type": "Innato Am", "color": "Blue with Red and Gold Bubbles", "model": "INNATO"}	{}	\N	f	05112925386550	DPD Germany	https://tracking.dpd.de/status/de_DE/parcel/05112925386550	2024-12-10 20:30:47	\N	delivered	2024-12-10 20:30:47	2025-04-24 22:19:58.812937	2025-04-24 22:20:41.497
182	SW-1411	6221771505995	Prayas Gandhi	prayas.gandhi@gmail.com	+31205313233	Oosterdok 2	Amsterdam	\N	1011 VX	Netherlands	retail	f	\N	delivered	2024-09-27 03:06:02	\N	Ordering pickup so I can take delivery from you in India in Jan. This is Prayas Gandhi	0	{"key": "Smokefired black/ Red and Copper Bubbles", "type": "Innato flute", "color": "A - medium/ large hands", "model": "INNATO", "tuning": "440 Hz", "tuningFrequency": "440 Hz"}	{}	\N	f	\N	\N	\N	2025-04-20 20:24:54	\N	delivered	2025-04-20 20:24:54	2025-04-24 22:20:05.781065	2025-04-24 22:20:57.112
189	SW-1404	6206930256203	Andreas Kidess	akidess@yahoo.com	+4915783086390	Hinter den Kämpen 2	Düsseldorf	\N	40489	Germany	retail	f	\N	delivered	2024-09-17 17:10:22	\N	Innato flute\n€750,00\nSize: B - medium hands\nFinish: Blue/ Red and Gold Bubbles\ntuning: 432 Hz	0	{"key": "Blue/ Red and Gold Bubbles", "type": "Innato flute", "color": "B - medium hands", "model": "INNATO", "tuning": "432 Hz", "tuningFrequency": "432 Hz"}	{}	\N	f	05112925385839	DPD Germany	https://tracking.dpd.de/status/de_DE/parcel/05112925385839	2024-11-17 19:57:14	\N	delivered	2024-11-17 19:57:14	2025-04-24 22:20:07.50464	2025-04-24 22:21:01.687
160	SW-1433	6262259646795	Brian Blauch	bkblauch@gmail.com	+13365586392	2108 Liberty Dr	Greensboro	North Carolina	27408	United States	retail	f	\N	delivered	2024-10-22 03:28:27	\N		0	{"key": "Black with Red/Copper bubbles Smokefired", "type": "Natey flute", "color": "G4", "model": "NATEY", "tuning": "440 Hz", "tuningFrequency": "440 Hz"}	{}	\N	f	283022029017	FedEx	https://www.fedex.com/fedextrack/?trknbr=283022029017	\N	\N	delivered	2024-12-24 20:30:22	2025-04-24 22:19:59.046794	2025-04-24 22:21:27.413
223	SW-1370	6146058649931	Daniel Giel	danielgiel@gmail.com	+19179575015	150 East 18th Street, #6A	New York	New York	10003	United States	retail	f	\N	delivered	2024-08-09 02:52:57	\N		0	{"key": "black with Gold Bubbles", "type": "Innato flute", "color": "Smoke fired Tiger Red", "model": "INNATO", "tuning": "440 Hz", "engraving": "No", "tuningFrequency": "440 Hz"}	{}	\N	f	279757478679	FedEx	https://www.fedex.com/fedextrack/?trknbr=279757478679	2024-09-23 13:13:27	2025-04-28 22:32:45.1	in_transit	\N	2025-04-24 22:20:15.922566	2025-04-24 22:32:52.657
225	SW-1368	6142453055819	Алиса Баснарева	basnalisa@gmail.com	+34630026133	Consell 8, 4C	Altea	Alicante	03590	Spain	retail	f	\N	delivered	2024-08-06 10:21:06	\N		0	{"key": "A - medium/ large hands", "type": "Innato flute", "color": "Blue/ Red and Gold Bubbles", "model": "INNATO", "tuning": "432 Hz", "tuningFrequency": "432 Hz"}	{}	\N	f	05112925383183	DPD Germany	https://tracking.dpd.de/status/de_DE/parcel/05112925383183	2024-09-21 07:30:02	\N	processing	\N	2025-04-24 22:20:16.393282	2025-04-24 22:32:52.778
226	SW-1367	6136700633419	Thibaut Pansard	thibautpansard@hotmail.fr	0636102671	20 Rue Du Verger Jacob	Savigny-sous-mâlain	\N	21540	France	retail	f	\N	delivered	2024-08-02 12:08:56	\N		0	{"type": "ZENflute", "color": "Large - E3", "model": "ZEN"}	{}	\N	f	279757400579	FedEx	https://www.fedex.com/fedextrack/?trknbr=279757400579	2024-09-21 07:28:03	\N	delivered	2025-04-23 22:32:45.103	2025-04-24 22:20:16.630627	2025-04-24 22:32:52.839
227	SW-1366	6135755768139	Luke Cornwell	smithderek4077@gmail.com	+13158792383	490 Queen street, Apt 113	Charlottetown	Prince Edward Island	C1A 8R9	Canada	retail	f	\N	delivered	2024-08-01 17:40:10	\N		0	{"key": "black with Gold Bubbles", "type": "Innato flute", "color": "Smoke fired Tiger Red", "model": "INNATO", "tuning": "440 Hz", "engraving": "No", "tuningFrequency": "440 Hz"}	{}	\N	f	280576749733	FedEx	https://www.fedex.com/fedextrack/?trknbr=280576749733	2024-10-13 14:26:42	\N	delivered	2025-04-24 22:32:45.101	2025-04-24 22:20:16.873652	2025-04-24 22:32:52.899
228	SW-1365	6134085910859	Juan Jose Jimenez Alcaraz	juanjo.jimenez@hotmail.com	625517334	Avinguda de Francesc Macià, num.81 piso 3 puerta 3	Olesa de Montserrat	Barcelona	08640	Spain	retail	f	\N	delivered	2024-07-31 19:01:29	\N		0	{"key": "Black with Red/Copper bubbles Smokefired", "type": "Natey flute", "color": "C4", "model": "NATEY", "tuning": "432 Hz", "tuningFrequency": "432 Hz"}	{}	\N	f	280351431090	FedEx	https://www.fedex.com/fedextrack/?trknbr=280351431090	2024-10-07 18:30:50	\N	delivered	2025-04-22 22:32:45.102	2025-04-24 22:20:17.112786	2025-04-24 22:32:52.959
230	SW-1363	6129345069387	Alex Smeele	alexsmeele@gmail.com	+6421495060	210 Oraha Road, RD2	Kumeu	Auckland	0892	New Zealand	retail	f	\N	delivered	2024-07-28 22:00:04	\N		0	{"key": "C# - small/ medium hands", "type": "Innato flute", "color": "Smokefired black/ Red and Copper Bubbles", "model": "INNATO", "tuning": "432 Hz", "tuningFrequency": "432 Hz"}	{}	\N	f	279757400513	FedEx	https://www.fedex.com/fedextrack/?trknbr=279757400513	2024-09-21 07:41:54	2025-04-28 22:32:45.104	in_transit	\N	2025-04-24 22:20:17.640708	2025-04-24 22:32:53.081
231	SW-1362	6114938028363	Chintan Sheth	chintz604@gmail.com	+61490057912	169 Arundel Street	Forest Lodge	New South Wales	2037	Australia	retail	f	\N	delivered	2024-07-18 14:03:27	\N		0	{"key": "Blue with Red/Gold Bubbles Smokefired", "type": "Natey flute", "color": "D4", "model": "NATEY"}	{}	\N	f	279757400101	FedEx	https://www.fedex.com/fedextrack/?trknbr=279757400101	2024-09-21 07:32:20	\N	processing	\N	2025-04-24 22:20:17.879747	2025-04-24 22:32:53.142
232	SW-1361	6113572880715	alani waters	alaniwaters@gmail.com	3034950459	1950 Whitmore Ave, 13	Los Angeles	California	90039	United States	retail	f	\N	delivered	2024-07-17 23:52:59	\N		0	{"key": "Red with Gold Bubble Smokefired", "type": "Natey flute", "color": "A3", "model": "NATEY", "tuning": "440 Hz", "tuningFrequency": "440 Hz"}	{}	\N	f	277759269083	FedEx	https://www.fedex.com/fedextrack/?trknbr=277759269083	2024-08-01 06:01:28	2025-04-28 22:32:45.105	in_transit	\N	2025-04-24 22:20:18.11416	2025-04-24 22:32:53.203
233	SW-1360	6113342193995	Maria Pineda	mipineda@ucsd.edu	8585343273	7835 Trade Street, Suite 100	San Diego	California	92121	United States	retail	f	\N	delivered	2024-07-17 21:35:36	\N		0	{"key": "A - medium/ large hands", "type": "Innato flute", "color": "Smoke fired Blue/ Red and Gold Bubbles", "model": "INNATO", "tuning": "432 Hz", "tuningFrequency": "432 Hz"}	{}	\N	f	279757399766	FedEx	https://www.fedex.com/fedextrack/?trknbr=279757399766	2024-09-21 07:32:57	\N	delivered	2025-04-22 22:32:45.107	2025-04-24 22:20:18.355629	2025-04-24 22:32:53.27
236	SW-1357	6111217156427	siver tveita	revis-naturlige@hotmail.com	+4794874101	Hedenstadveien 147	skollenborg	\N	3619	Norway	retail	f	\N	delivered	2024-07-16 20:49:35	\N		0	{"key": "Artists Choice", "type": "Double flute", "color": "Medium B Native", "model": "DOUBLE", "tuning": "432 Hz", "tuningFrequency": "432 Hz"}	{}	\N	f	79757400502	FedEx	https://www.fedex.com/fedextrack/?trknbr=79757400502	2024-09-21 07:31:39	\N	processing	\N	2025-04-24 22:20:19.073795	2025-04-24 22:32:53.456
237	SW-1356	6107395981643	Balazs Bercsenyi	balazs.bercsenyi@gmail.com	+36301108250	48-as tér 1., Jogi Kar A porta	Pécs	\N	7621	Hungary	retail	f	\N	delivered	2024-07-15 00:12:51	\N		0	{"key": "B - medium hands", "type": "Innato flute", "color": "Blue/ Red and Gold Bubbles", "model": "INNATO", "tuning": "432 Hz", "tuningFrequency": "432 Hz"}	{}	\N	f	5112925383185	DPD Germany	https://tracking.dpd.de/status/de_DE/parcel/5112925383185	2024-09-21 07:29:00	\N	delivered	2025-04-24 22:32:45.11	2025-04-24 22:20:19.310272	2025-04-24 22:32:53.517
239	SW-1354	6105303449931	Tracy Tchai	tq.tchai@gmail.com	0650673367	Gaffelaar 22	Barendrecht	\N	2991 DB	Netherlands	retail	f	\N	delivered	2024-07-13 10:22:55	\N		0	{"key": "C - medium hands", "type": "Innato flute", "color": "Smoke fired Blue/ Red and Gold Bubbles", "model": "INNATO", "tuning": "440 Hz", "tuningFrequency": "440 Hz"}	{}	\N	f	05112925383184	DPD Germany	https://tracking.dpd.de/status/de_DE/parcel/05112925383184	2024-09-21 07:27:01	2025-04-29 22:32:45.108	in_transit	\N	2025-04-24 22:20:19.807164	2025-04-24 22:32:53.642
240	SW-1353	6100800831819	Barbara Elizen	barbaraelizen@gmail.com	0620269610	Binnenweg 15	Ellecom	\N	6955 AT	Netherlands	retail	f	\N	delivered	2024-07-09 18:33:11	\N		0	{"key": "Red with Gold Bubble Smokefired", "type": "Natey flute", "color": "G#4", "model": "NATEY"}	{}	\N	f	05112925382812	DPD Germany	https://tracking.dpd.de/status/de_DE/parcel/05112925382812	2024-08-25 20:26:27	\N	delivered	2025-04-22 22:32:45.111	2025-04-24 22:20:20.044777	2025-04-24 22:32:53.703
222	SW-1371	6146155708747	Marvin Seidel	marvinseidel@live.de	017660348048	Steinpfahl 2a	Merzenich	\N	52399	Germany	retail	f	\N	delivered	2024-08-09 06:40:22	\N		0	{"key": "Blue with Red/Gold Bubbles Smokefired", "type": "Natey flute", "color": "A4", "model": "NATEY", "tuning": "440 Hz", "tuningFrequency": "440 Hz"}	{}	\N	f	05112925383186	DPD Germany	https://tracking.dpd.de/status/de_DE/parcel/05112925383186	2024-09-21 07:44:51	\N	processing	\N	2025-04-24 22:20:15.68228	2025-04-24 22:32:52.594
245	SW-1348	6091011785035	Kerem Brule	kerembrule@gmail.com	+16195492924	9229 Regents Road, L117	La Jolla	California	92037	United States	reseller	t	KEREM	delivered	2024-07-02 15:54:18	\N	Drop ship for Beautiful Sounds	0	{"key": "A - medium/ large hands", "type": "Innato flute", "color": "Blue/ Red and Gold Bubbles", "model": "INNATO", "tuning": "432 Hz", "tuningFrequency": "432 Hz"}	{}	\N	f	278699631802	FedEx	https://www.fedex.com/fedextrack/?trknbr=278699631802	2024-08-25 20:18:35	2025-04-27 22:32:46.286	in_transit	\N	2025-04-24 22:20:21.264764	2025-04-28 19:19:21.269
254	SW-1340	6079595577675	Kerem Brule	kerembrule@gmail.com	+16195492924	13910 Fiji Way	Marina del Rey	California	90292	United States	reseller	t	KEREM	delivered	2024-06-24 21:05:45	\N	Drop Ship for Beautiful Sounds	0	{"key": "B - medium hands", "type": "Innato flute", "color": "Blue/ Red and Gold Bubbles", "model": "INNATO", "tuning": "432 Hz", "tuningFrequency": "432 Hz"}	{}	\N	f	278699630195	FedEx	https://www.fedex.com/fedextrack/?trknbr=278699630195	2024-08-25 20:19:59	2025-04-27 22:32:46.289	in_transit	\N	2025-04-24 22:20:23.998606	2025-04-28 19:19:23.637
255	SW-1339	6074012074315	Ivo Sedlacek	info@savita.cz	+420603481984	U Srnciho dolu 11	jablonec nad nisou	\N	466 01	Czech Republic	reseller	t	SAVITA	delivered	2024-06-20 09:52:10	\N		0	{"key": "G - large hands", "type": "Innato flute", "color": "Blue/ Red and Gold Bubbles", "model": "INNATO"}	{}	\N	f	276643604089	FedEx	https://www.fedex.com/fedextrack/?trknbr=276643604089	2024-07-03 14:35:59	\N	processing	\N	2025-04-24 22:20:24.243381	2025-04-28 19:19:23.937
246	SW-1347	6088474886475	Nikki Leader	nikkileader12@gmail.com	07968552998	Flat 4 Snowhill house	Easebourne	England	GU29 0AE	United Kingdom	retail	f	\N	delivered	2024-06-30 21:08:02	\N		0	{"key": "Blue with Red/Gold Bubbles Smokefired", "type": "Natey flute", "color": "A4", "model": "NATEY", "tuning": "432 Hz", "tuningFrequency": "432 Hz"}	{}	\N	f	279757400112	FedEx	https://www.fedex.com/fedextrack/?trknbr=279757400112	2024-09-21 07:43:58	2025-04-28 22:32:46.286	in_transit	\N	2025-04-24 22:20:21.503456	2025-04-24 22:32:54.008
247	SW-1346	6086768525643	Bénédicte DUFRENNE	\N	+33618663491	7 Allée des Lavognes	Castelnau-le-Lez	\N	34170	France	retail	f	\N	delivered	2024-06-29 17:44:06	\N		0	{"key": "C - medium hands", "type": "Innato flute", "color": "Blue/ Red and Gold Bubbles", "model": "INNATO"}	{}	\N	f	05112925382811	DPD Germany	https://tracking.dpd.de/status/de_DE/parcel/05112925382811	2024-08-25 20:16:53	\N	processing	\N	2025-04-24 22:20:21.739914	2025-04-24 22:32:54.075
249	SW-1344	6082793177419	Dennis Jünkersfeld	dennis.juenkersfeld@yahoo.de	015786026131	Stielhock 1	Münster	\N	48161	Germany	retail	f	\N	delivered	2024-06-26 21:40:21	\N		0	{"key": "B - medium hands", "type": "Innato flute", "color": "Blue/ Red and Gold Bubbles", "model": "INNATO", "tuning": "440 Hz", "tuningFrequency": "440 Hz"}	{}	\N	f	280350982217	FedEx	https://www.fedex.com/fedextrack/?trknbr=280350982217	2024-10-07 18:29:12	\N	delivered	2025-04-24 22:32:46.287	2025-04-24 22:20:22.265979	2025-04-24 22:32:54.211
251	SW-1342	6079931580747	Flavia Astolfi	gfmdirenzo@gmail.com	3404681297	viale Antonio Ciamarra 158, Sc. F int. 9	Roma	Roma	00173	Italy	retail	f	\N	delivered	2024-06-25 08:35:05	\N	Exhange because of wrong color	0	{"key": "A - medium/ large hands", "type": "Innato flute", "color": "Smoke fired Tiger Red/ Black no Bubbles", "model": "INNATO", "tuning": "440 Hz", "tuningFrequency": "440 Hz"}	{}	\N	f	280350977755	FedEx	https://www.fedex.com/fedextrack/?trknbr=280350977755	2024-10-07 18:30:03	\N	processing	\N	2025-04-24 22:20:22.804701	2025-04-24 22:32:54.28
250	SW-1343	6081701183819	Jan (Karen) van der Stappen (Korff de Gidts)	karenkdg4@gmail.com	0655174376	Provincialeweg 69	Velddriel	\N	5334 JE	Netherlands	retail	f	\N	delivered	2024-06-26 09:40:20	\N		0	{"key": "A - medium/ large hands", "type": "Innato flute", "color": "Blue/ Red and Gold Bubbles", "model": "INNATO", "tuning": "432 Hz", "tuningFrequency": "432 Hz"}	{}	\N	f	\N	\N	\N	2024-11-17 20:39:19	\N	delivered	2024-11-17 20:39:19	2025-04-24 22:20:22.56486	2025-04-24 22:22:18.245
242	SW-1351	6095673590091	Cassius Hirst	cassiushirst@gmail.com	07920024368	Thames Wharf Studios, Rainville Road	london	England	W6 9HA	United Kingdom	retail	f	\N	delivered	2024-07-06 03:25:24	\N		0	{"key": "C# - small/ medium hands", "type": "Innato flute", "color": "Blue/ Red and Gold Bubbles", "model": "INNATO", "tuning": "440 Hz", "tuningFrequency": "440 Hz"}	{}	\N	f	278699630942	FedEx	https://www.fedex.com/fedextrack/?trknbr=278699630942	2024-08-25 20:20:27	\N	delivered	2025-04-24 22:32:45.11	2025-04-24 22:20:20.522822	2025-04-24 22:32:53.824
256	SW-1338	6073777815883	Unknown Customer	svaram@auroville.org.in	+914132622220	SVARAM - Musical Instruments and Research Auroville	Irumbai B.O	Tamil Nadu	605111	India	retail	f	\N	delivered	2024-06-20 06:05:19	\N		0	{"key": "C - medium hands", "type": "Innato flute", "color": "Blue/ Red and Gold Bubbles", "model": "INNATO"}	{}	\N	f	05112925389203	DPD	https://tracking.dpd.de/parcel/05112925389203	2024-08-07 08:56:04	\N	delivered	2025-04-22 22:32:46.29	2025-04-24 22:20:26.584617	2025-04-24 22:32:54.528
257	SW-1336	6070920511819	Paul Kaye	paulkaye@msia.org	3233281915	1629 Cimarron Street	Los Angeles	California	90019	United States	retail	f	\N	delivered	2024-06-17 18:04:46	\N		0	{"key": "C - medium hands", "type": "Innato flute", "color": "Blue/ Red and Gold Bubbles", "model": "INNATO", "tuning": "432 Hz", "tuningFrequency": "432 Hz"}	{}	\N	f	277759070195	FedEx	https://www.fedex.com/fedextrack/?trknbr=277759070195	2024-08-01 05:53:52	\N	delivered	2025-04-24 22:32:46.291	2025-04-24 22:20:26.81845	2025-04-24 22:32:54.591
259	SW-1334	6068532576587	frans deprez	osteofrans@gmail.com	+32472251127	Hé du Seigneur, 44	odeigne	\N	6960	Belgium	retail	f	\N	delivered	2024-06-16 06:35:58	\N		0	{"key": "D# - small hands", "type": "Innato flute", "color": "Blue/ Red and Gold Bubbles", "model": "INNATO", "tuning": "432 Hz", "tuningFrequency": "432 Hz"}	{}	\N	f	 05112925382616	DPD Germany	https://tracking.dpd.de/status/de_DE/parcel/05112925382616	2024-08-07 06:29:06	\N	processing	\N	2025-04-24 22:20:27.297404	2025-04-24 22:32:54.715
260	SW-1333	6068171866443	Ramon Heiniger	ramonheiniger@gmail.com	+41788500747	Alte Gasse 2	Emdthal	\N	3711	Switzerland	retail	f	\N	delivered	2024-06-15 19:16:21	\N		0	{"key": "Black with Red/Copper bubbles Smokefired", "type": "Natey flute", "color": "A3", "model": "NATEY", "tuning": "440 Hz", "tuningFrequency": "440 Hz"}	{}	\N	f	277759066090	FedEx	https://www.fedex.com/fedextrack/?trknbr=277759066090	2024-08-01 05:56:50	\N	processing	\N	2025-04-24 22:20:27.533895	2025-04-24 22:32:54.775
261	SW-1332	6067265929547	Esteban Herard	esteban.herard@gmail.com	0666486401	3 Rue Creuse	Garnay	\N	28500	France	retail	f	\N	delivered	2024-06-15 08:31:36	\N		0	{"key": "Black with Red/Copper bubbles Smokefired", "type": "Natey flute", "color": "D4", "model": "NATEY", "tuning": "432 Hz", "tuningFrequency": "432 Hz"}	{}	\N	f	278699629077	FedEx	https://www.fedex.com/fedextrack/?trknbr=278699629077	2024-08-25 20:17:25	2025-04-26 22:32:46.297	in_transit	\N	2025-04-24 22:20:27.776172	2025-04-24 22:32:54.836
243	SW-1350	6094465663307	anna Liem	anna@annaliem.nl	+31619989807	Zandstraat 128	Bergen op Zoom	\N	4614 CM	Netherlands	retail	f	\N	ordered	2024-07-05 06:24:18	\N		0	{"key": "C# - small/ medium hands", "type": "Innato flute", "color": "Smokefired black/ Red and Copper Bubbles", "model": "INNATO"}	{}	\N	t	\N	\N	\N	\N	\N	\N	\N	2025-04-24 22:20:20.768778	2025-04-24 22:24:42.513
142	SW-1451	6299906015563	Lucas Rölleke Pinto Wahnon	lroelleke@yahoo.de	965881028	São João da Praça 60, 3° Esq	Lisboa	Lisboa	1100-520	Portugal	retail	f	\N	delivered	2024-11-14 11:57:23	\N		0	{"key": "Smoke fired Blue/ Red and Gold Bubbles", "type": "Innato flute", "color": "G - large hands", "model": "INNATO", "engraving": "No"}	{}	\N	f	05112925387151	DPD Germany	https://tracking.dpd.de/status/de_DE/parcel/05112925387151	2025-01-05 15:32:35	\N	delivered	2025-01-05 15:38:47	2025-04-24 22:19:51.708259	2025-04-24 22:20:29.045
147	SW-1446	6292721140043	Reuben Schleiger	reubenschleiger@gmail.com	+13606214856	16273 Reitan Road Northeast	Bainbridge Island	Washington	98110	United States	retail	f	\N	delivered	2024-11-10 06:46:07	\N		0	{"key": "Black with red/ Copper Bubble Smokefired", "type": "Natey flute", "color": "C4", "model": "NATEY", "tuning": "432 Hz", "tuningFrequency": "432 Hz"}	{}	\N	f	LA100555714NL	PostNL Domestic	https://jouw.postnl.nl/track-and-trace/	2025-01-05 15:45:34	\N	delivered	2025-01-05 15:45:34	2025-04-24 22:19:53.331113	2025-04-24 22:20:32.92
153	SW-1440	6286060290379	Matthew Mallory	mattmallory96@gmail.com	8453375983	2717 Western Ave apt 1000, 1000	Seattle	Washington	98121	United States	retail	f	\N	delivered	2024-11-06 04:58:41	\N		0	{"key": "Blue/ Red and Gold Bubbles", "type": "Innato flute", "color": "C - medium hands", "model": "INNATO", "engraving": "No"}	{}	\N	f	283022038618	FedEx	https://www.fedex.com/fedextrack/?trknbr=283022038618	2024-12-10 20:31:57	\N	delivered	2024-12-19 02:11:08	2025-04-24 22:19:57.264605	2025-04-24 22:20:37.407
138	SW-1455	6302508220747	Kajsa Lindgren	kajsahannalindgren@gmail.com	+46739196467	Grycksbovägen 89	Bandhagen	\N	124 30	Sweden	retail	f	\N	delivered	2024-11-16 07:44:33	\N		0	{"key": "Blue/ Red and Gold Bubbles", "type": "Innato flute", "color": "C - medium hands", "model": "INNATO", "engraving": "No"}	{}	\N	f	05112925387149	DPD Germany	https://tracking.dpd.de/status/de_DE/parcel/05112925387149	2025-01-05 15:37:41	\N	processing	\N	2025-04-24 22:19:50.442793	2025-04-24 22:32:51.022
269	SW-1324	6052415766859	Kerem Brule	kerembrule@gmail.com	+16195492924	81 Dot Avenue, Unit A	Campbell	California	95008	United States	reseller	t	KEREM	delivered	2024-06-05 17:12:55	\N		0	{"key": "D - small hands", "type": "Innato flute", "color": "Blue/ Red and Gold Bubbles", "model": "INNATO", "tuning": "440 Hz", "tuningFrequency": "440 Hz"}	{}	\N	f	277759066104	FedEx	https://www.fedex.com/fedextrack/?trknbr=277759066104	2024-08-01 05:54:47	2025-04-25 22:32:47.463	in_transit	\N	2025-04-24 22:20:29.71252	2025-04-28 19:19:27.61
22	SW-1570	6551805854027	Kerem Brule	kerembrule@gmail.com	+16195492924	1604 Northeast Bryant Street	Portland	Oregon	97211	United States	reseller	t	KEREM	cancelled	2025-03-20 17:58:08	\N		0	{"key": "440 Hz", "type": "Innato Dm4", "color": "Smokefired Blue with Red and Bronze Bubbles", "model": "INNATO"}	{"cancelled": "2025-04-29T18:59:21.293Z"}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-04-24 22:19:17.274925	2025-04-29 18:59:21.293
264	SW-1329	6061260144971	Nathalie Ravilet	nravilet@gmail.com	+34606700154	Calle de Ventura de la Vega 6, 4C	Madrid	Madrid	28014	Spain	retail	f	\N	delivered	2024-06-11 15:00:09	\N		0	{"key": "D - small hands", "type": "Innato flute", "color": "Smokefired black/ Red and Copper Bubbles", "model": "INNATO", "tuning": "432 Hz", "tuningFrequency": "432 Hz"}	{}	\N	f	05112925382549	DPD Germany	https://tracking.dpd.de/status/de_DE/parcel/05112925382549	2024-08-01 05:47:50	2025-04-27 22:32:46.298	in_transit	\N	2025-04-24 22:20:28.495001	2025-04-24 22:32:55.026
265	SW-1328	6059591074123	maria christina dreesmann	mariadreesmann.nl@gmail.com	644968730	Kerkplein 4	Bloemendaal	\N	2061 JC	Netherlands	retail	f	\N	delivered	2024-06-10 11:03:51	\N	77777	0	{"key": "A - medium/ large hands", "type": "Innato flute", "color": "Blue/ Red and Gold Bubbles", "model": "INNATO", "tuning": "432 Hz", "tuningFrequency": "432 Hz"}	{}	\N	f	 05112925382615	DPD Germany	https://tracking.dpd.de/status/de_DE/parcel/05112925382615	2024-08-07 06:28:29	\N	delivered	2025-04-24 22:32:47.46	2025-04-24 22:20:28.743174	2025-04-24 22:32:55.089
266	SW-1327	6054933496139	Hatim Belyamani	hatimalias@me.com	+14085058591	141 Old Forestburg Road	Sparrow Bush	New York	12780	United States	retail	f	\N	delivered	2024-06-07 15:49:22	\N		0	{"type": "ZENflute", "color": "Medium - G3", "model": "ZEN"}	{}	\N	f	277529481460	FedEx	https://www.fedex.com/fedextrack/?trknbr=277529481460	2024-07-26 08:11:45	\N	processing	\N	2025-04-24 22:20:28.98126	2025-04-24 22:32:55.15
270	SW-1323	6048748568907	Alexander Westervelt	awesterv@gci.net	9073317141	3648 Mary Anne Ct.	Anchorage	Alaska	99502	United States	retail	f	\N	delivered	2024-06-02 21:21:54	\N		0	{"key": "E - small hands", "type": "Innato flute", "color": "Blue/ Red and Gold Bubbles", "model": "INNATO", "tuning": "440 Hz", "tuningFrequency": "440 Hz"}	{}	\N	f	277759066950	FedEx	https://www.fedex.com/fedextrack/?trknbr=277759066950	2024-08-01 05:53:04	2025-04-27 22:32:47.463	in_transit	\N	2025-04-24 22:20:29.949181	2025-04-24 22:32:55.392
272	SW-1321	6046088102219	Michal Lövinger	misolovinger@gmail.com	+421905920498	Priepasné, 83	Priepasné	\N	906 15	Slovakia	retail	f	\N	delivered	2024-05-31 18:54:27	\N		0	{"key": "F# - large hands", "type": "Innato flute", "color": "Smokefired black/ Red and Copper Bubbles", "model": "INNATO"}	{}	\N	f	05112925382612	DPD Germany	https://tracking.dpd.de/status/de_DE/parcel/05112925382612	2024-08-07 06:26:32	\N	delivered	2025-04-23 22:32:47.464	2025-04-24 22:20:30.428013	2025-04-24 22:32:55.514
273	SW-1320	6045363372363	Angela Knight	connect@calmbuddhi.com.au	+61409178849	268 Boundary Road	Dromana	Victoria	3936	Australia	retail	f	\N	delivered	2024-05-31 11:00:32	\N		0	{"key": "C - medium hands", "type": "Innato flute", "color": "Blue/ Red and Gold Bubbles", "model": "INNATO", "tuning": "440 Hz", "tuningFrequency": "440 Hz"}	{}	\N	f	278699629467	Other	\N	2024-08-25 20:19:09	\N	processing	\N	2025-04-24 22:20:30.678321	2025-04-24 22:32:55.576
274	SW-1319	6040617681227	Andy Chester	andy.chester@ntlworld.com	07957560169	200 Hurdsfield Road	Macclesfield	England	SK10 2PX	United Kingdom	retail	f	\N	delivered	2024-05-28 12:27:34	\N		0	{"key": "A - medium/ large hands", "type": "Innato flute", "color": "Smokefired black/ Red and Copper Bubbles", "model": "INNATO", "tuning": "440 Hz", "tuningFrequency": "440 Hz"}	{}	\N	f	277759068449	FedEx	https://www.fedex.com/fedextrack/?trknbr=277759068449	2024-08-01 05:51:16	2025-04-25 22:32:47.465	in_transit	\N	2025-04-24 22:20:30.914318	2025-04-24 22:32:55.637
275	SW-1318	6040405279051	Patricia Caprez	pmcap@hotmail.com	0767246977	Burgstrasse 4	Volketswil	\N	8604	Switzerland	retail	f	\N	delivered	2024-05-28 09:35:57	\N		0	{"key": "black with Gold Bubbles", "type": "Innato flute", "color": "Smoke fired Tiger Red", "model": "INNATO", "tuning": "440 Hz", "engraving": "No", "tuningFrequency": "440 Hz"}	{}	\N	f	278699631982	FedEx	https://www.fedex.com/fedextrack/?trknbr=278699631982	2024-08-25 20:21:03	2025-04-28 22:32:47.466	in_transit	\N	2025-04-24 22:20:31.155346	2025-04-24 22:32:55.699
276	SW-1317	6040048795979	HYPNOTIC ROCKET	etiennechassagnol@hotmail.fr	+33672496818	80 Rue Curial, 19ème Arrondissement	Paris	\N	75019	France	retail	f	\N	delivered	2024-05-27 22:43:30	\N		0	{"key": "A - medium/ large hands", "type": "Innato flute", "color": "Smokefired black/ Red and Copper Bubbles", "model": "INNATO"}	{}	\N	f	277987693030	FedEx	https://www.fedex.com/fedextrack/?trknbr=277987693030	2024-08-07 06:30:45	2025-04-26 22:32:47.466	in_transit	\N	2025-04-24 22:20:31.393213	2025-04-24 22:32:55.761
278	SW-1315	6038695510347	Katrīna Mačuka	kmacuka@gmail.com	+37126661508	Krišjāņa Valdemāra iela 73	Rīga	\N	1013	Latvia	retail	f	\N	delivered	2024-05-26 22:03:17	\N		0	{"key": "A - medium/ large hands", "type": "Innato flute", "color": "Smoke fired Blue/ Red and Gold Bubbles", "model": "INNATO", "tuning": "432 Hz", "tuningFrequency": "432 Hz"}	{}	\N	f	 05112925382611	DPD Germany	https://tracking.dpd.de/status/de_DE/parcel/05112925382611	2024-08-07 06:27:10	\N	delivered	2025-04-24 22:32:47.467	2025-04-24 22:20:31.870199	2025-04-24 22:32:55.886
280	SW-1313	6035206570315	Judy Young	youngninethree@gmail.com	+31617495115	Rodenrijsstraat 116	Amsterdam	\N	1062 JA	Netherlands	retail	f	\N	delivered	2024-05-24 09:48:26	\N		0	{"key": "Black with Red/Copper bubbles Smokefired", "type": "Natey flute", "color": "D4", "model": "NATEY", "tuning": "432 Hz", "tuningFrequency": "432 Hz"}	{}	\N	f	05112925382468	DPD Germany	https://tracking.dpd.de/status/de_DE/parcel/05112925382468	2024-07-26 08:02:38	\N	processing	\N	2025-04-24 22:20:33.068592	2025-04-24 22:32:55.95
279	SW-1314	6036097663307	Alan Tower	alan@theresonancecenter.com	\N	2045 Meridian Avenue, Apt A	South Pasadena	California	91030	United States	retail	f	\N	delivered	2024-05-25 05:59:31	\N		0	{"key": "Bb - medium/ large hands", "type": "Innato flute", "color": "Blue/ Red and Gold Bubbles", "model": "INNATO"}	{}	\N	f	\N	\N	\N	2024-07-19 06:29:42	\N	delivered	2024-07-19 06:29:42	2025-04-24 22:20:32.104479	2025-04-24 22:22:38.087
282	SW-1311	6034700239179	Sam Hirschfelder	sam.hirschfelder@gmail.com	+61408700508	16 Cotham Road, Suite 151	Kew	Victoria	3101	Australia	retail	f	\N	delivered	2024-05-23 18:52:35	\N		0	{"type": "ZENflute", "color": "Large - E3", "model": "ZEN"}	{}	\N	f	 277529481004	FedEx	https://www.fedex.com/fedextrack/?trknbr=277529481004	2024-07-26 08:12:48	2025-04-28 22:32:47.485	in_transit	\N	2025-04-24 22:20:33.540269	2025-04-24 22:32:56.07
285	SW-1308	6034162352459	Clare Netterfield	clare.e.newhouse@gmail.com	+61422489252	33 Rylah Crescent	Wanniassa	Australian Capital Territory	2903	Australia	retail	f	\N	delivered	2024-05-23 10:48:41	\N		0	{"key": "C - medium hands", "type": "Innato flute", "color": "Smoke fired Blue/ Red and Gold Bubbles", "model": "INNATO", "tuning": "432 Hz", "tuningFrequency": "432 Hz"}	{}	\N	f	276646447464	FedEx	https://www.fedex.com/fedextrack/?trknbr=276646447464	2024-07-03 15:11:35	\N	delivered	2025-04-22 22:32:48.703	2025-04-24 22:20:34.380854	2025-04-24 22:32:56.254
286	SW-1307	6033793253707	Andy Kinsella	mail@andyfernandez.com	+61423594350	PO Box 375	THIRROUL	New South Wales	2515	Australia	retail	f	\N	delivered	2024-05-23 01:00:33	\N		0	{"key": "Bb - medium/ large hands", "type": "Innato flute", "color": "Smokefired black/ Red and Copper Bubbles", "model": "INNATO", "tuning": "440 Hz", "tuningFrequency": "440 Hz"}	{}	\N	f	277987694459	FedEx	https://www.fedex.com/fedextrack/?trknbr=277987694459	2024-08-07 06:31:26	\N	delivered	2025-04-22 22:32:48.705	2025-04-24 22:20:34.616636	2025-04-24 22:32:56.315
288	SW-1305	6031799320907	Joel Thomson	jol.thoms@gmail.com	00447533625386	3 Lingards Road	London	England	SE13 6DH	United Kingdom	retail	f	\N	delivered	2024-05-21 12:35:53	\N		0	{"key": "Blue with Red/Gold Bubbles Smokefired", "type": "Natey flute", "color": "A3", "model": "NATEY"}	{}	\N	f	276646445818	FedEx	https://www.fedex.com/fedextrack/?trknbr=276646445818	2024-07-03 15:12:16	2025-04-28 22:32:48.704	in_transit	\N	2025-04-24 22:20:35.09395	2025-04-24 22:32:56.435
289	SW-1304	6031094382923	Tabitha Allen	allentabitha@gmail.com	+447512642042	81 Bluebell Drive	Penicuik	Scotland	EH26 0GZ	United Kingdom	retail	f	\N	delivered	2024-05-20 19:13:13	\N		0	{"key": "D - small hands", "type": "Innato flute", "color": "Smokefired black/ Red and Copper Bubbles", "model": "INNATO", "tuning": "440 Hz", "tuningFrequency": "440 Hz"}	{}	\N	f	276646447280	FedEx	https://www.fedex.com/fedextrack/?trknbr=276646447280	2024-07-03 15:11:57	2025-04-25 22:32:48.707	in_transit	\N	2025-04-24 22:20:35.330117	2025-04-24 22:32:56.496
290	SW-1303	6030603682123	Ana Rosa Ibanez	anarosadechile@gmail.com	01728121956	Maybachufer 44	Berlin	\N	12047	Germany	retail	f	\N	delivered	2024-05-20 12:22:48	\N		0	{"key": "C - medium hands", "type": "Innato flute", "color": "Smoke fired Tiger Red/ Black no Bubbles", "model": "INNATO"}	{}	\N	f	05112925382162	DPD Germany	https://tracking.dpd.de/status/de_DE/parcel/05112925382162	2024-07-03 15:10:05	\N	delivered	2025-04-23 22:32:48.708	2025-04-24 22:20:35.566498	2025-04-24 22:32:56.556
291	SW-1302	6029882327371	Jan Suchánek	jann.suchanek@gmail.com	+420 737 636 646	Antonina Kopeckeho 44	Novy Hradek	\N	549 22	Czech Republic	retail	f	\N	delivered	2024-05-19 18:10:59	\N		0	{"key": "C - medium hands", "type": "Innato flute", "color": "Smoke fired Blue/ Red and Gold Bubbles", "model": "INNATO", "tuning": "432 Hz", "tuningFrequency": "432 Hz"}	{}	\N	f	05112925382161	DPD Germany	https://tracking.dpd.de/status/de_DE/parcel/05112925382161	2024-07-03 15:10:55	\N	processing	\N	2025-04-24 22:20:35.808993	2025-04-24 22:32:56.618
293	SW-1300	6024367604043	Svend Thorup Jensen	svendtjensen@hotmail.com	+4560718408	Rådmandsgade 25, 3	København N	\N	2200	Denmark	retail	f	\N	delivered	2024-05-16 08:39:53	\N		0	{"key": "Black with Red/Copper bubbles Smokefired", "type": "Natey flute", "color": "D4", "model": "NATEY", "tuning": "432 Hz", "tuningFrequency": "432 Hz"}	{}	\N	f	277759068140	FedEx	https://www.fedex.com/fedextrack/?trknbr=277759068140	2024-08-01 05:48:59	\N	processing	\N	2025-04-24 22:20:36.294661	2025-04-24 22:32:56.742
295	SW-1298	6019252715851	Birgitte Bakke	birgar@gmail.com	+4792467314	Hetlebakkvegen 117 a	Bergen	\N	5131	Norway	retail	f	\N	delivered	2024-05-11 22:25:53	\N		0	{"key": "G# - large hands", "type": "Innato flute", "color": "Smokefired black/ Red and Copper Bubbles", "model": "INNATO", "tuning": "432 Hz", "tuningFrequency": "432 Hz"}	{}	\N	f	276646449044	FedEx	https://www.fedex.com/fedextrack/?trknbr=276646449044	2024-07-03 15:10:32	\N	processing	\N	2025-04-24 22:20:36.771503	2025-04-24 22:32:56.806
294	SW-1299	6021115543883	Femke Bergvelt	femkela27@hotmail.com	+31614884165	20	Leiderdorp	\N	2352 RH	Netherlands	retail	f	\N	delivered	2024-05-13 14:28:15	\N		0	{"key": "C - medium hands", "type": "Innato flute", "color": "Blue/ Red and Gold Bubbles", "model": "INNATO", "tuning": "440 Hz", "tuningFrequency": "440 Hz"}	{}	\N	f	\N	\N	\N	2024-06-14 10:14:12	\N	delivered	2024-06-14 10:14:12	2025-04-24 22:20:36.533217	2025-04-24 22:22:48.623
296	SW-1297	6016951779659	Phil Iddon	phil_iddon@hotmail.com	+447846503778	22 Cambridge Road	Liverpool	England	L37 2EL	United Kingdom	retail	f	\N	delivered	2024-05-09 20:28:09	\N		0	{"key": "Blue with Red/Gold Bubbles Smoke fires", "type": "Double flute", "color": "Medium B Native", "model": "DOUBLE", "tuning": "432 Hz", "tuningFrequency": "432 Hz"}	{}	\N	f	276645420921	FedEx	https://www.fedex.com/fedextrack/?trknbr=276645420921	2024-07-03 14:54:27	\N	delivered	2025-04-22 22:32:48.714	2025-04-24 22:20:37.008984	2025-04-24 22:32:56.868
298	SW-1295	6016815333707	Diesner Susanne	susanne.diesner@gmx.de	+491722112563	Florastraße 56	Düsseldorf	\N	40217	Germany	retail	f	\N	delivered	2024-05-09 18:13:25	\N		0	{"key": "C - medium hands", "type": "Innato flute", "color": "Blue/ Red and Gold Bubbles", "model": "INNATO", "tuning": "432 Hz", "tuningFrequency": "432 Hz"}	{}	\N	f	 276645419181	FedEx	https://www.fedex.com/fedextrack/?trknbr=276645419181	2024-07-03 14:53:34	2025-04-27 22:32:48.716	in_transit	\N	2025-04-24 22:20:37.498543	2025-04-24 22:32:56.996
299	SW-1294	6013444653387	Amanda Tinker	braintwitch@gmail.com	8137320581	3787 East Street	Pittsburgh	Pennsylvania	15214	United States	retail	f	\N	delivered	2024-05-07 01:08:50	\N		0	{"key": "E - small hands", "type": "Innato flute", "color": "Blue/ Red and Gold Bubbles", "model": "INNATO", "tuning": "440 Hz", "tuningFrequency": "440 Hz"}	{}	\N	f	276645422019	FedEx	https://www.fedex.com/fedextrack/?trknbr=276645422019	2024-07-03 14:54:46	2025-04-26 22:32:48.716	in_transit	\N	2025-04-24 22:20:37.733458	2025-04-24 22:32:57.059
300	SW-1293	6012809511243	Daniela Nöninger	danielabitter@web.de	+4915154410282	Hammerbachstr. 4	Walpertskirchen	\N	85469	Germany	retail	f	\N	delivered	2024-05-06 13:47:56	\N		0	{"key": "F - large hands", "type": "Innato flute", "color": "Blue/ Red and Gold Bubbles", "model": "INNATO", "tuning": "432 Hz", "tuningFrequency": "432 Hz"}	{}	\N	f	276645419560	FedEx	https://www.fedex.com/fedextrack/?trknbr=276645419560	2024-07-03 14:55:09	\N	delivered	2025-04-24 22:32:48.717	2025-04-24 22:20:37.968334	2025-04-24 22:32:57.12
301	SW-1292	6010725826891	Rosie Spinks	rosiespinksss@gmail.com	07791998895	106 Seymour Avenue	London	England	N17 9ED	United Kingdom	retail	f	\N	delivered	2024-05-04 21:19:06	\N		0	{"key": "Red with Gold Bubble Smokefired", "type": "Natey flute", "color": "A4", "model": "NATEY", "tuning": "440 Hz", "tuningFrequency": "440 Hz"}	{}	\N	f	275904313697	FedEx	https://www.fedex.com/fedextrack/?trknbr=275904313697	2024-06-14 10:08:13	\N	delivered	2025-04-23 22:32:48.718	2025-04-24 22:20:38.205552	2025-04-24 22:32:57.18
162	SW-1431	6257318232395	Klaus Fetkenheuer	klaus.fetkenheuer@web.de	+4917684621815	Schlossmühle, 1	Kolitzheim	\N	97509	Germany	retail	f	\N	delivered	2024-10-18 07:14:29	\N		0	{"key": "Red with Gold Bubble Smokefired", "type": "Natey flute", "color": "D4", "model": "NATEY"}	{}	\N	f	283022025629	FedEx	https://www.fedex.com/fedextrack/?trknbr=283022025629	2024-12-10 20:29:59	\N	delivered	2024-12-12 09:59:06	2025-04-24 22:19:59.577513	2025-04-24 22:20:43.422
177	SW-1416	6228850868555	Ashley Jarmack	ashleyjarmack@gmail.com	6268256550	111 El Nido Ave	Monrovia	California	91016	United States	retail	f	\N	delivered	2024-10-02 05:35:26	\N		0	{"key": "Red with Gold Bubble Smokefired", "type": "Natey flute", "color": "A4", "model": "NATEY", "tuning": "440 Hz", "tuningFrequency": "440 Hz"}	{}	\N	f	281897665751	FedEx	https://www.fedex.com/fedextrack/?trknbr=281897665751	2024-11-17 19:59:25	\N	delivered	2024-11-22 22:49:04	2025-04-24 22:20:04.453841	2025-04-24 22:20:53.936
186	SW-1407	6217482764619	Dorry Aben	dorryaben@gmail.com	+31615285188	Gasthuislaan, 97, 97	HAARLEM	\N	2013 TA	Netherlands	retail	f	\N	delivered	2024-09-24 05:53:59	\N		0	{"key": "Red with Gold Bubble Smokefired", "type": "Natey flute", "color": "C4", "model": "NATEY", "tuning": "440 Hz", "tuningFrequency": "440 Hz"}	{}	\N	f	05112925385570	FedEx	https://www.fedex.com/fedextrack/?trknbr=05112925385570	2024-11-05 08:48:38	\N	delivered	2024-11-05 08:49:15	2025-04-24 22:20:06.797483	2025-04-24 22:20:59.731
310	SW-1283	6002499486027	Hailun Buzz	hailunbuzz@gmail.com	+17138577089	4522 Lexington Avenue, APT-7	Los Angeles	California	90029	United States	retail	f	\N	delivered	2024-04-28 15:24:02	\N		0	{"key": "C - medium hands", "type": "Innato flute", "color": "Blue/ Red and Gold Bubbles", "model": "INNATO", "tuning": "440 Hz", "tuningFrequency": "440 Hz"}	{}	\N	f	275331533316	FedEx	https://www.fedex.com/fedextrack/?trknbr=275331533316	2024-05-31 09:45:28	\N	delivered	2024-06-06 23:24:04	2025-04-24 22:20:40.416372	2025-04-24 22:22:59.167
305	SW-1288	6007807902027	Arnaud Pellerin	prikos.promo@wanadoo.fr	+33240542344	1, Rue Saint Nicolas	Clisson	\N	44190	France	retail	f	\N	delivered	2024-05-02 15:06:46	\N	Hello Hans, \nWe liked the instruments with the less high pitch tone whistle possible. Thanks for all your magnificent instruments :) Arnö	0	{"key": "C - medium hands", "type": "Innato flute", "color": "Smoke fired Blue/ Red and Gold Bubbles", "model": "INNATO", "tuning": "432 Hz", "tuningFrequency": "432 Hz"}	{}	\N	f	275949436527	FedEx	https://www.fedex.com/fedextrack/?trknbr=275949436527	\N	2025-04-28 22:32:49.796	in_transit	\N	2025-04-24 22:20:39.152255	2025-04-24 22:32:57.43
308	SW-1285	6003746767179	Henny Nettenbreijers	\N	+31646233885	Ruwaardstr 5	Oss	\N	5342 AH	Netherlands	retail	f	\N	delivered	2024-04-29 14:59:02	\N		0	{"key": "C - medium hands", "type": "Innato flute", "color": "Blue/ Red and Gold Bubbles", "model": "INNATO", "tuning": "440 Hz", "tuningFrequency": "440 Hz"}	{}	\N	f	286664622458	FedEx	https://www.fedex.com/fedextrack/?trknbr=286664622458	2024-05-29 12:21:54	\N	processing	\N	2025-04-24 22:20:39.938342	2025-04-24 22:32:57.615
312	SW-1281	6000697966923	Thomas Osmonson	thomas.osmonson@gmail.com	+16122755305	560 Otis Avenue	Saint Paul	Minnesota	55104	United States	retail	f	\N	delivered	2024-04-27 02:26:30	\N		0	{"key": "F# - large hands", "type": "Innato flute", "color": "Blue/ Red and Gold Bubbles", "model": "INNATO", "tuning": "440 Hz", "tuningFrequency": "440 Hz"}	{}	\N	f	275904412785	FedEx	https://www.fedex.com/fedextrack/?trknbr=275904412785	2024-06-14 10:10:44	\N	delivered	2024-06-19 18:38:10	2025-04-24 22:20:40.902359	2025-04-24 22:23:00.43
309	SW-1284	6003591643467	Bénédicte DUFRENNE	benedicte.dufrenne@laposte.net	+33618663491	7 ALLEE DES LAVOGNES, ALLEE DES LAVOGNES	Castelnau-le-Lez	\N	34170	France	retail	f	\N	delivered	2024-04-29 13:14:25	\N		0	{"type": "ZENflute", "color": "Medium - G3", "model": "ZEN"}	{}	\N	f	274912706172	FedEx	https://www.fedex.com/fedextrack/?trknbr=274912706172	2024-05-21 08:55:49	\N	delivered	2024-05-27 08:24:05	2025-04-24 22:20:40.174771	2025-04-24 22:22:58.512
311	SW-1282	6002154832203	Jessica Hughes	jess.hughes@fane.co.uk	+447901715684	Office 310, The Gallery, Bedford Row	Limerick	Limerick	V94 VY47	Ireland	retail	f	\N	delivered	2024-04-28 11:06:43	\N		0	{"type": "ZENflute", "color": "Medium - G3", "model": "ZEN"}	{}	\N	f	275331975254	FedEx	https://www.fedex.com/fedextrack/?trknbr=275331975254	2024-05-31 10:09:55	\N	delivered	2024-06-05 10:37:05	2025-04-24 22:20:40.664701	2025-04-24 22:22:59.822
314	SW-1279	6000613491019	Nikolina Baran	nikolinabaran@gmail.com	+48532656364	Rynek podgórski 7, apartment 18, flat 4	Kraków	\N	30-518	Poland	retail	f	\N	delivered	2024-04-26 20:47:41	\N	I want a Bbm but I didn't saw an option to choose this one, so please make it Bbm:). And Thank you for making this beautiful instruments:)	0	{"key": "Bb - medium/ large hands", "type": "Innato flute", "color": "Smoke fired Blue/ Red and Gold Bubbles", "model": "INNATO", "tuning": "432 Hz", "tuningFrequency": "432 Hz"}	{}	\N	f	5112925381576	DPD Germany	https://tracking.dpd.de/status/de_DE/parcel/5112925381576	2024-05-31 09:44:50	\N	delivered	2024-05-31 09:44:50	2025-04-24 22:20:41.377236	2025-04-24 22:23:01.785
313	SW-1280	6000633119051	Even Aas Bjørnstad	even.aas@hotmail.com	+4793454848	Jongsstubben 23	SANDVIKA	\N	1337	Norway	retail	f	\N	delivered	2024-04-26 21:18:52	\N		0	{"key": "Black with Red/Copper bubbles Smokefired", "type": "Natey flute", "color": "B3", "model": "NATEY", "tuning": "440 Hz", "tuningFrequency": "440 Hz"}	{}	\N	f	275331531997	FedEx	https://www.fedex.com/fedextrack/?trknbr=275331531997	2024-05-31 09:45:12	\N	delivered	2024-06-03 11:49:07	2025-04-24 22:20:41.140405	2025-04-24 22:23:01.152
167	SW-1426	6249275752779	Guy Mathilde Flanquart Krawiec	guy.flanquart@gmail.com	+33629335306	43 Rue Pierre Bauve, Chez Mr et Mme Flanquart	Courrières	\N	62710	France	retail	f	\N	delivered	2024-10-13 09:09:27	\N		0	{"key": "Smokefired black/ Red and Copper Bubbles", "type": "Innato flute", "color": "G - large hands", "model": "INNATO", "engraving": "No"}	{}	\N	f	05112925388961	DPD NL	https://www.dpdgroup.com/nl/mydpd/my-parcels/search?lang=nl_NL&parcelNumber=05112925388961	2025-04-20 19:36:46	\N	delivered	2025-04-23 22:32:40.857	2025-04-24 22:20:00.838218	2025-04-24 22:32:51.098
306	SW-1287	6005298823499	sam minto	samminto1@gmail.com	015734402296	Thessaloniki-Allee 1	Köln	\N	51103	Germany	retail	f	\N	delivered	2024-04-30 15:18:18	\N		0	{"key": "Red with Gold Bubble Smokefired", "type": "Natey flute", "color": "C4", "model": "NATEY"}	{}	\N	f	5112925381577	DPD Germany	https://tracking.dpd.de/status/de_DE/parcel/5112925381577	2024-05-31 09:45:56	2025-04-27 22:32:49.796	in_transit	\N	2025-04-24 22:20:39.448479	2025-04-24 22:32:57.49
176	SW-1417	6229329609035	Hobie Johnson	hobs1992@yahoo.com	13183087756	506 clear creek road	Pollock	Louisiana	71467	United States	retail	f	\N	delivered	2024-10-02 12:14:58	\N		0	{"key": "Black with Red/Copper bubbles Smokefired", "type": "Natey flute", "color": "A4", "model": "NATEY"}	{}	\N	f	281897667103	FedEx	https://www.fedex.com/fedextrack/?trknbr=281897667103	\N	\N	delivered	2024-12-01 20:00:15	2025-04-24 22:20:04.216367	2025-04-24 22:21:30.948
196	SW-1397	6197390475595	Ksenia Luki	bigxuh@gmail.com	3234505703	1337 N Sierra Bonita Ave apt 104	West Hollywood	California	90046	United States	retail	f	\N	delivered	2024-09-11 03:53:47	\N		0	{"key": "Smokefired black/ Red and Copper Bubbles", "type": "Innato flute", "color": "G - large hands", "model": "INNATO", "tuning": "440 Hz", "tuningFrequency": "440 Hz"}	{}	\N	f	283021255789	FedEx	https://www.fedex.com/fedextrack/?trknbr=283021255789	2024-12-10 08:38:40	\N	delivered	2024-12-18 22:45:07	2025-04-24 22:20:09.279185	2025-04-24 22:21:37.766
253	SW-1341	6079598428491	Kerem Brule	kerembrule@gmail.com	+16195492924	3183 Brookside Lane	Encinitas	California	92024	United States	reseller	t	KEREM	delivered	2024-06-24 21:08:58	\N		0	{"key": "F# - large hands", "type": "Innato flute", "color": "Blue/ Red and Gold Bubbles", "model": "INNATO", "tuning": "440 Hz", "tuningFrequency": "440 Hz"}	{}	\N	f	278699631191	FedEx	https://www.fedex.com/fedextrack/?trknbr=278699631191	2024-08-25 20:17:59	2025-04-26 22:32:46.29	in_transit	\N	2025-04-24 22:20:23.755405	2025-04-28 19:19:23.269
204	SW-1389	6185534521675	Daniel Andersson	daniel.andersson78@gmail.com	+46707991549	Franstorpsvägen 15	Sundbyberg	\N	172 66	Sweden	retail	f	\N	delivered	2024-09-02 10:43:48	\N		0	{"key": "C - medium hands", "type": "Innato flute", "color": "Smoke fired Blue/ Red and Gold Bubbles", "model": "INNATO"}	{}	\N	f	05112925383515	DPD Germany	https://tracking.dpd.de/status/de_DE/parcel/05112925383515	2024-10-13 14:58:07	\N	delivered	2025-04-24 22:32:43.933	2025-04-24 22:20:11.282447	2025-04-24 22:32:51.536
208	SW-1385	6177146208587	Antonio Escobar	antonioescobar74@gmail.com	+4367681032127	Kröllgasse 17, 16	Wien	\N	1150	Austria	retail	f	\N	delivered	2024-08-27 09:12:32	\N		0	{"key": "Red with Gold Bubble Smokefired", "type": "Natey flute", "color": "G3", "model": "NATEY"}	{}	\N	f	05112925383513	DPD Germany	https://tracking.dpd.de/status/de_DE/parcel/05112925383513	2024-10-13 14:35:43	\N	processing	\N	2025-04-24 22:20:12.288932	2025-04-24 22:32:51.778
211	SW-1382	6173423894859	Flora Dietiker	floraimhoof@hotmail.com	+41763107963	Rynetelstrasse 3a	Gränichen	\N	5722	Switzerland	retail	f	\N	delivered	2024-08-24 17:38:50	\N		0	{"key": "Black with Red/Copper bubbles Smokefired", "type": "Double flute", "color": "Medium C Native", "model": "DOUBLE", "tuning": "440 Hz", "tuningFrequency": "440 Hz"}	{}	\N	f	280577256999	FedEx	https://www.fedex.com/fedextrack/?trknbr=280577256999	2024-10-13 14:36:52	\N	delivered	2025-04-24 22:32:43.938	2025-04-24 22:20:13.004843	2025-04-24 22:32:51.961
217	SW-1376	6156941164875	Arnaud Pellerin	prikos.promo@wanadoo.fr	0033240542344	1 Rue Saint-Nicolas	Clisson	\N	44190	France	retail	f	\N	delivered	2024-08-14 13:09:13	\N		0	{"key": "A - medium/ large hands", "type": "Innato flute", "color": "Blue/ Red and Gold Bubbles", "model": "INNATO", "tuning": "432 Hz", "tuningFrequency": "432 Hz"}	{}	\N	f	05112925383511	DPD Germany	https://tracking.dpd.de/status/de_DE/parcel/05112925383511	2024-10-13 14:38:18	2025-04-25 22:32:43.938	in_transit	\N	2025-04-24 22:20:14.437114	2025-04-24 22:32:52.28
221	SW-1372	6148274323787	Ussama Atiye	ussi89@gmx.net	015738183305	Franz-Rauch-Straße 4	Sinzheim	\N	76547	Germany	retail	f	\N	delivered	2024-08-10 20:26:50	\N	We would be happy if you give us a bag or something else, to carry. 	0	{"key": "G - large hands", "type": "Innato flute", "color": "Blue/ Red and Gold Bubbles", "model": "INNATO", "tuning": "440 Hz", "tuningFrequency": "440 Hz"}	{}	\N	f	280352590504	FedEx	https://www.fedex.com/fedextrack/?trknbr=280352590504	2024-10-07 18:32:50	\N	delivered	2025-04-22 22:32:43.941	2025-04-24 22:20:15.448078	2025-04-24 22:32:52.534
224	SW-1369	6145786151243	Zoltán Farkas	1rgum3urgum@gmail.com	+36706316601	Podmaniczky Utca 9, Areco Informatikai KFT. Utcáról nyíló üzlethelyiség.	Budapest	\N	1065	Hungary	retail	f	\N	delivered	2024-08-08 18:20:58	\N		0	{"key": "A - medium/ large hands", "type": "Innato flute", "color": "Smokefired black/ Red and Copper Bubbles", "model": "INNATO"}	{}	\N	f	279757478679	FedEx	https://www.fedex.com/fedextrack/?trknbr=279757478679	2024-09-23 13:13:55	2025-04-28 22:32:45.1	in_transit	\N	2025-04-24 22:20:16.158376	2025-04-24 22:32:52.717
229	SW-1364	6133076590923	MIRACLE DE FREITAS	de.freitas.mdf@gmail.com	3017931199	48 RANDOLPH RD	PLAINFIELD	New Jersey	07060	United States	retail	f	\N	delivered	2024-07-31 11:03:09	\N		0	{"key": "Bb - medium/ large hands", "type": "Innato flute", "color": "Smoke fired Blue/ Red and Gold Bubbles", "model": "INNATO", "tuning": "432 Hz", "tuningFrequency": "432 Hz"}	{}	\N	f	281897668280	FedEx	https://www.fedex.com/fedextrack/?trknbr=281897668280	2024-11-17 20:03:49	2025-04-26 22:32:45.104	in_transit	\N	2025-04-24 22:20:17.402371	2025-04-24 22:32:53.02
234	SW-1359	6113340555595	Andre Duqum	andre@merakimedia.com	+12485049480	21140 Colina Dr	Topanga	California	90290	United States	retail	f	\N	delivered	2024-07-17 21:34:49	\N		0	{"key": "C - medium hands", "type": "Innato flute", "color": "Smoke fired Blue/ Red and Gold Bubbles", "model": "INNATO", "tuning": "432 Hz", "tuningFrequency": "432 Hz"}	{}	\N	f	279757399398	FedEx	https://www.fedex.com/fedextrack/?trknbr=279757399398	2024-09-21 07:43:02	\N	delivered	2025-04-24 22:32:45.106	2025-04-24 22:20:18.596564	2025-04-24 22:32:53.33
238	SW-1355	6106238943563	Andy Gruhin	andygruhin@gmail.com	3015126368	1411 Longhill Drive	Potomac	Maryland	20854	United States	retail	f	\N	delivered	2024-07-14 07:28:43	\N		0	{"key": "Artists Choice", "type": "Double flute", "color": "Medium Bb3 Native", "model": "DOUBLE", "tuning": "432 Hz", "tuningFrequency": "432 Hz"}	{}	\N	f	279757399262	FedEx	https://www.fedex.com/fedextrack/?trknbr=279757399262	2024-09-21 07:34:22	2025-04-28 22:32:45.107	in_transit	\N	2025-04-24 22:20:19.568984	2025-04-24 22:32:53.579
241	SW-1352	6098181521739	Sean Geiger	itsaninja024@yahoo.com	+18312772789	8 Merrill Way	Carmel Valley	California	93924	United States	retail	f	\N	delivered	2024-07-07 20:27:46	\N		0	{"key": "F - large hands", "type": "Innato flute", "color": "Smokefired black/ Red and Copper Bubbles", "model": "INNATO", "tuning": "432 Hz", "tuningFrequency": "432 Hz"}	{}	\N	f	279757399608	FedEx	https://www.fedex.com/fedextrack/?trknbr=279757399608	2024-09-21 07:33:37	2025-04-25 22:32:45.112	in_transit	\N	2025-04-24 22:20:20.281711	2025-04-24 22:32:53.764
244	SW-1349	6091289362763	Marc De Beer	marc@marcdebeer.nl	0630666494	Bosstraat 77	Soest	\N	3766 AD	Netherlands	retail	f	\N	delivered	2024-07-02 19:08:17	\N		0	{"key": "Red with Gold Bubble Smokefired", "type": "Natey flute", "color": "D4", "model": "NATEY", "tuning": "440 Hz", "tuningFrequency": "440 Hz"}	{}	\N	f	05112925382617	DPD Germany	https://tracking.dpd.de/status/de_DE/parcel/05112925382617	2024-08-07 06:27:45	2025-04-28 22:32:46.284	in_transit	\N	2025-04-24 22:20:21.007558	2025-04-24 22:32:53.889
248	SW-1345	6084692214091	Andrew Pyza	sail178@hotmail.com	0031653529238	Sandenburg 47	Heemskerk	\N	1965 NJ	Netherlands	retail	f	\N	delivered	2024-06-28 09:31:47	\N		0	{"key": "A - medium/ large hands", "type": "Innato flute", "color": "Smokefired black/ Red and Copper Bubbles", "model": "INNATO", "tuning": "432 Hz", "tuningFrequency": "432 Hz"}	{}	\N	f	05112925382810	DPD Germany	https://tracking.dpd.de/status/de_DE/parcel/05112925382810	2024-08-25 20:16:19	\N	delivered	2025-04-22 22:32:46.286	2025-04-24 22:20:21.975155	2025-04-24 22:32:54.139
263	SW-1330	6064052765003	Nathalie Pilaire	petaledelumiere@gmail.com	0685277750	11 Rue René Yves Creston	Lannion	\N	22300	France	retail	f	\N	delivered	2024-06-13 14:10:22	\N		0	{"key": "C - medium hands", "type": "Innato flute", "color": "Blue/ Red and Gold Bubbles", "model": "INNATO", "tuning": "432 Hz", "tuningFrequency": "432 Hz"}	{}	\N	f	05112925382548	DPD Germany	https://tracking.dpd.de/status/de_DE/parcel/05112925382548	2024-08-01 05:55:46	\N	delivered	2025-04-23 22:32:46.296	2025-04-24 22:20:28.252402	2025-04-24 22:32:54.963
284	SW-1309	6034306957643	Pascal MAILLARD	zenesens.pascal@gmail.com	0676479773	20b rue des Plumes	Hochstatt	\N	68720	France	retail	f	\N	delivered	2024-05-23 12:54:49	\N		0	{"key": "Red with Gold Bubble Smokefired", "type": "Natey flute", "color": "C4", "model": "NATEY"}	{}	\N	f	277529482331	FedEx	https://www.fedex.com/fedextrack/?trknbr=277529482331	2024-07-26 08:03:55	2025-04-27 22:32:47.49	in_transit	\N	2025-04-24 22:20:34.136836	2025-04-24 22:32:56.194
303	SW-1290	6009566757195	Jessie Gouin-huard	gostyeti@gmail.com	+1 819-342-9920	928 Rue Chrétien	Sherbrooke	Quebec	J1R 0S8	Canada	retail	f	\N	delivered	2024-05-04 01:11:48	\N		0	{"key": "Bb - medium/ large hands", "type": "Innato flute", "color": "Smokefired black/ Red and Copper Bubbles", "model": "INNATO"}	{}	\N	f	275904441428	FedEx	https://www.fedex.com/fedextrack/?trknbr=275904441428	2024-06-14 10:14:58	\N	delivered	2025-04-22 22:32:48.72	2025-04-24 22:20:38.676671	2025-04-24 22:32:57.301
258	SW-1335	6069590196555	baruch de leest	baruchdeleest@gmail.com	0497386192	Van Daelstraat 71	Antwerpen	\N	2140	Belgium	retail	f	\N	delivered	2024-06-16 21:52:39	\N		0	{"key": "C - medium hands", "type": "Innato flute", "color": "Smoke fired Blue/ Red and Gold Bubbles", "model": "INNATO"}	{}	\N	f	 05112925382613	DPD Germany	https://tracking.dpd.de/status/de_DE/parcel/05112925382613	2024-08-07 06:24:36	2025-04-25 22:32:46.293	in_transit	\N	2025-04-24 22:20:27.054687	2025-04-24 22:32:54.651
262	SW-1331	6064966664523	Winter James	winterjamesartist@gmail.com	07850317567	Church House Church Road, Flat, Flat 2, Flat 2	Caernarfon	Wales	LL55 4TF	United Kingdom	retail	f	\N	delivered	2024-06-14 00:45:38	\N		0	{"key": "Bb - medium/ large hands", "type": "Innato flute", "color": "Smoke fired Blue/ Red and Gold Bubbles", "model": "INNATO", "tuning": "440 Hz", "tuningFrequency": "440 Hz"}	{}	\N	f	277759069055	FedEx	https://www.fedex.com/fedextrack/?trknbr=277759069055	2024-08-01 05:50:07	\N	delivered	2025-04-22 22:32:46.296	2025-04-24 22:20:28.011589	2025-04-24 22:32:54.9
267	SW-1326	6054877299019	Romedio Aichbichler	alarich98@gmx.at	+436605052554	Witzelsbergergasse 5, 12	Wien	\N	1150	Austria	retail	f	\N	delivered	2024-06-07 15:04:45	\N		0	{"key": "Bb - medium/ large hands", "type": "Innato flute", "color": "Smoke fired Blue/ Red and Gold Bubbles", "model": "INNATO"}	{}	\N	f	 05112925382610	DPD Germany	https://tracking.dpd.de/status/de_DE/parcel/05112925382610	2024-08-07 06:29:49	2025-04-25 22:32:47.462	in_transit	\N	2025-04-24 22:20:29.221734	2025-04-24 22:32:55.21
271	SW-1322	6048440451403	Jakub Smeja	kubosmeja@gmail.com	+421904107953	Švabinského 16	Bratislava	\N	851 01	Slovakia	retail	f	\N	delivered	2024-06-02 17:51:36	\N		0	{"key": "C - medium hands", "type": "Innato flute", "color": "Blue/ Red and Gold Bubbles", "model": "INNATO", "tuning": "432 Hz", "tuningFrequency": "432 Hz"}	{}	\N	f	05112925382547	DPD Germany	https://tracking.dpd.de/status/de_DE/parcel/05112925382547	2024-08-01 05:46:05	\N	delivered	2025-04-24 22:32:47.465	2025-04-24 22:20:30.186443	2025-04-24 22:32:55.454
277	SW-1316	6039902290251	Ingrid Kamp	\N	+31614100215	Koopmanwei 4	Valkenswaard	\N	5551 PP	Netherlands	retail	f	\N	delivered	2024-05-27 19:52:15	\N		0	{"key": "C - medium hands", "type": "Innato flute", "color": "Blue/ Red and Gold Bubbles", "model": "INNATO", "tuning": "440 Hz", "tuningFrequency": "440 Hz"}	{}	\N	f	05112925382614	DPD Germany	https://tracking.dpd.de/status/de_DE/parcel/05112925382614	2024-08-07 06:25:33	\N	delivered	2025-04-23 22:32:47.467	2025-04-24 22:20:31.631141	2025-04-24 22:32:55.823
281	SW-1312	6034896814411	Sierra Swinney	sierraswinney@gmail.com	+15596799888	P.O. Box 643, 41110 Blossom Dr	Three Rivers	California	93271	United States	retail	f	\N	delivered	2024-05-24 00:45:43	\N		0	{"key": "Blue with Red/Gold Bubbles", "type": "Natey flute", "color": "C4", "model": "NATEY", "tuning": "440 Hz", "tuningFrequency": "440 Hz"}	{}	\N	f	277529482147	FedEx	https://www.fedex.com/fedextrack/?trknbr=277529482147	2024-07-26 08:04:43	2025-04-29 22:32:47.469	in_transit	\N	2025-04-24 22:20:33.306168	2025-04-24 22:32:56.01
283	SW-1310	6034620318027	Serena Salteri	correnteserena@gmail.com	3282277255	loc Poggio Sociana 13A	Reggello	Firenze	50066	Italy	retail	f	\N	delivered	2024-05-23 17:37:11	\N		0	{"key": "Artists Choice", "type": "Double flute", "color": "Large F Native", "model": "DOUBLE", "tuning": "432 Hz", "tuningFrequency": "432 Hz"}	{}	\N	f	05112925382807	DPD Germany	https://tracking.dpd.de/status/de_DE/parcel/05112925382807	2024-08-25 20:13:57	\N	processing	\N	2025-04-24 22:20:33.777177	2025-04-24 22:32:56.134
287	SW-1306	6032712204619	Federica Vettori	federica.vettori.85@gmail.com	3391073029	Via Roma 135	Figline Valdarno	Firenze	50063	Italy	retail	f	\N	delivered	2024-05-22 08:48:13	\N		0	{"key": "C# - small/ medium hands", "type": "Innato flute", "color": "Smoke fired Tiger Red/ Black no Bubbles", "model": "INNATO", "tuning": "440 Hz", "tuningFrequency": "440 Hz"}	{}	\N	f	277759069890	FedEx	https://www.fedex.com/fedextrack/?trknbr=277759069890	2024-08-01 05:52:03	\N	delivered	2025-04-24 22:32:48.704	2025-04-24 22:20:34.853247	2025-04-24 22:32:56.375
292	SW-1301	6024419737931	Elif Rueckner	elif.okay@hotmail.com	0176 80096090	Ederstraße 9	Berlin	\N	12059	Germany	retail	f	\N	delivered	2024-05-16 09:21:51	\N		0	{"key": "Red with Gold Bubble Smokefired", "type": "Natey flute", "color": "C4", "model": "NATEY", "tuning": "440 Hz", "tuningFrequency": "440 Hz"}	{}	\N	f	276646446160	FedEx	https://www.fedex.com/fedextrack/?trknbr=276646446160	2024-07-03 15:11:16	\N	delivered	2025-04-23 22:32:48.712	2025-04-24 22:20:36.05059	2025-04-24 22:32:56.68
297	SW-1296	6016927564107	Sean Harland	sean@mattersfx.com	07584908483	127 Rucklers Lane	Kings Langley, Dacorum	England	WD4 8BA	United Kingdom	retail	f	\N	delivered	2024-05-09 20:02:41	\N		0	{"key": "C - medium hands", "type": "Innato flute", "color": "Smoke fired Blue/ Red and Gold Bubbles", "model": "INNATO", "tuning": "432 Hz", "tuningFrequency": "432 Hz"}	{}	\N	f	276645421527	FedEx	https://www.fedex.com/fedextrack/?trknbr=276645421527	2024-07-03 14:54:08	2025-04-29 22:32:48.715	in_transit	\N	2025-04-24 22:20:37.256174	2025-04-24 22:32:56.932
302	SW-1291	6009723912523	Emanuele Pertoldi	emanuelepertoldi@gmail.com	3478931343	Via Ronchi 53	Udine	Udine	33100	Italy	retail	f	\N	delivered	2024-05-04 08:03:10	\N	Finally I made the order! :)\r\nI was very undecided between the blue/red and gold bubbles and the one I picked. Is it possible to have it with the colours  I choose but with a bit more white? I would like it to be light and not too intense if possible :)	0	{"key": "F# - large hands", "type": "Innato flute", "color": "Smoke fired Blue/ Red and Gold Bubbles", "model": "INNATO", "tuning": "440 Hz", "tuningFrequency": "440 Hz"}	{}	\N	f	276086002053	FedEx	https://www.fedex.com/fedextrack/?trknbr=276086002053	2024-06-19 08:26:14	2025-04-26 22:32:48.721	in_transit	\N	2025-04-24 22:20:38.441145	2025-04-24 22:32:57.24
69	SW-1524	6442049732939	Jeremiah Elias Menzel	jem.menzel@gmail.com	01776179894	Elisabethenstraße 1	Bad Homburg vor der Hohe	\N	61348	Germany	retail	f	\N	delivered	2025-01-19 21:58:02	\N		0	{"key": "440 Hz", "type": "Innato Bm3", "color": "Blue, with Terra and Gold Bubbles", "model": "INNATO"}	{}	\N	f	05112925388955	DPD NL	https://www.dpdgroup.com/nl/mydpd/my-parcels/search?lang=nl_NL&parcelNumber=05112925388955	2025-04-20 19:02:42	2025-04-25 22:32:33.287	in_transit	\N	2025-04-24 22:19:32.963336	2025-04-24 22:32:50.5
198	SW-1395	6194209227083	Jana Hujerova	jana.hujerova@gmail.com	736287721	Schovaná, 467	Jablonec nad Nisou	\N	468 01	Czech Republic	retail	f	\N	delivered	2024-09-08 15:32:48	\N		0	{"key": "Black with Red/Copper bubbles Smokefired", "type": "Natey flute", "color": "C4", "model": "NATEY", "tuning": "432 Hz", "tuningFrequency": "432 Hz"}	{}	\N	f	05112925385571	FedEx	https://www.fedex.com/fedextrack/?trknbr=05112925385571	2024-11-05 08:48:16	\N	delivered	2025-04-23 22:32:42.408	2025-04-24 22:20:09.796725	2025-04-24 22:32:51.161
200	SW-1393	6190629617995	Marijn Wilemse	marijnwillemse12@gmail.com	0681148815	Postjesweg 53, 3	Amsterdam	\N	1057 DW	Netherlands	retail	f	\N	delivered	2024-09-05 18:09:05	\N		0	{"key": "Red with Gold Bubble Smokefired", "type": "Natey flute", "color": "G4", "model": "NATEY"}	{}	\N	f	ophalen	Other	\N	2024-10-13 14:11:44	\N	processing	\N	2025-04-24 22:20:10.28155	2025-04-24 22:32:51.282
201	SW-1392	6189416251723	Dax Castro	dax@daxcastro.com	+19168569347	8946 Coan Lane	Orangevale	California	95662	United States	retail	f	\N	delivered	2024-09-05 07:43:20	\N		0	{"key": "A - medium/ large hands", "type": "Innato flute", "color": "Smoke fired Blue/ Red and Gold Bubbles", "model": "INNATO", "tuning": "432 Hz", "tuningFrequency": "432 Hz"}	{}	\N	f	281898920670	FedEx	https://www.fedex.com/fedextrack/?trknbr=281898920670	2024-11-17 20:36:55	2025-04-27 22:32:42.41	in_transit	\N	2025-04-24 22:20:10.51588	2025-04-24 22:32:51.343
304	SW-1289	6007948804427	Thomas Armster	motorama@gmx.de	+4915774594348	Kastanienallee 31, Vh/links	Berlin	\N	10435	Germany	retail	f	\N	delivered	2024-05-02 16:53:32	\N		0	{"key": "Bb - medium/ large hands", "type": "Innato flute", "color": "Smoke fired Blue/ Red and Gold Bubbles", "model": "INNATO", "tuning": "440 Hz", "tuningFrequency": "440 Hz"}	{}	\N	f	276086002947	FedEx	https://www.fedex.com/fedextrack/?trknbr=276086002947	2024-06-19 08:30:37	\N	delivered	2025-04-23 22:32:48.737	2025-04-24 22:20:38.917199	2025-04-24 22:32:57.361
307	SW-1286	6004094697803	Kathryn Johnson	kathrynejohnson@hotmail.co.uk	07454784137	71 Elm Drive	Holmes Chapel	England	CW4 7QA	United Kingdom	retail	f	\N	delivered	2024-04-29 19:34:00	\N	Hi Ieke and Hans! I hope you’re having a wonderful week. I am so excited to be able to order an innato flute at last , after watching your Instagram page for several months now (I am @flourishhh.uk on there). Listening to them makes me feel instantly grounded, so I can’t wait to connect with the innato and practice the art of playing, so that I can eventually bring that to my sound bath community.\r\n\r\nI thought I’d just share who I was in case you wanted to know more than a name, as I noticed once in a video that you mentioned that you hold intentions for each person you’re crafting an instrument for, which I thought was beautiful. \r\n\r\nWhile I am writing here (and thank you for reading!), I wondered about asking if there was any possibility of adding some light pink or lilac to the finish I have chosen (ie with the blue and gold), to connect to the colours I use with my wellness page and therapy room? I think it’ll be “no” (and that is absolutely fine - I’ve been taught that you’re always better to ask if something is in your mind, just in case, but that a yes should not be expected!) Either way, I completely trust you and the process involved and am so excited to receive it in a couple of months. I will love it I’m sure!\r\n\r\nWith deep gratitude,\r\nKathryn 	0	{"key": "C - medium hands", "type": "Innato flute", "color": "Blue/ Red and Gold Bubbles", "model": "INNATO", "tuning": "432 Hz", "tuningFrequency": "432 Hz"}	{}	\N	f	275232522140	FedEx	https://www.fedex.com/fedextrack/?trknbr=275232522140	2024-05-29 12:32:25	\N	delivered	2025-04-22 22:32:49.802	2025-04-24 22:20:39.693189	2025-04-24 22:32:57.554
78	SW-1515	6428373549387	Marvin Schwarz	kalleklopps00@gmail.com	+491781135275	Hauptstraße 9	Göggingen	\N	73571	Germany	retail	f	\N	cancelled	2025-01-08 23:34:22	\N		0	{"key": "440 Hz", "type": "Double Medium Native Bbm3", "color": "Smokefired Blue with Red and Bronze Bubbles", "model": "DOUBLE"}	{"cancelled": "2025-04-29T18:59:28.303Z"}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-04-24 22:19:35.110542	2025-04-29 18:59:28.303
252	SW-1094	5706901684555	Ivo Sedlacek	info@savita.cz	+420603481984	\N	\N	\N	\N	\N	reseller	t	SAVITA	cancelled	2023-08-31 08:24:12	\N		0	{"key": "Red with Gold Bubble Smokefired", "type": "Natey flute", "color": "A4", "model": "NATEY"}	{"cancelled": "2025-04-29T18:59:53.842Z"}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-04-24 22:20:23.040718	2025-04-29 18:59:53.842
75	SW-1518	6432498909515	Philipp Krause	philmalighta@icloud.com	01725162543	Erfurter Strasse 1	Dresden	\N	01127	Germany	retail	f	\N	cancelled	2025-01-12 07:08:23	\N		0	{"key": "432 Hz", "type": "Double Large Native Am3", "color": "Blue, with Terra and Gold Bubbles", "model": "DOUBLE"}	{"cancelled": "2025-04-29T18:59:27.975Z"}	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-04-24 22:19:34.399124	2025-04-29 18:59:27.975
\.


--
-- TOC entry 3482 (class 0 OID 32815)
-- Dependencies: 223
-- Data for Name: production_notes; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.production_notes (id, order_id, item_id, note, created_by, created_at, source) FROM stdin;
\.


--
-- TOC entry 3496 (class 0 OID 49153)
-- Dependencies: 237
-- Data for Name: resellers; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.resellers (id, nickname, full_name, email, phone, shipping_address, discount_percentage, notes, is_active, created_at, updated_at, name, business_name, contact_name, address, city, state, zip, country, last_order_date) FROM stdin;
9	ONETONE	\N	\N	\N	\N	\N	Auto-created from order 51	t	2025-04-25 11:51:19.781	2025-04-25 11:51:19.781	ONETONE	\N	\N	\N	\N	\N	\N	US	\N
10	MITIA	\N	\N	\N	\N	\N	Auto-created from order 37	t	2025-04-25 11:51:32.745	2025-04-25 11:51:32.745	MITIA	\N	\N	\N	\N	\N	\N	US	\N
11	BILLY	\N	\N	\N	\N	\N	Auto-created from order 33	t	2025-04-25 11:52:44.12	2025-04-25 11:52:44.12	BILLY	\N	\N	\N	\N	\N	\N	US	\N
12	KEREM	\N	\N	\N	\N	\N	Auto-created from order 18	t	2025-04-25 12:04:39.388	2025-04-25 12:04:39.388	KEREM	\N	\N	\N	\N	\N	\N	US	\N
13	SAVITA	\N	info@savita.cz	\N	\N	\N	\N	t	2025-04-28 18:44:51.214992	2025-04-28 18:44:51.214992	Savita	\N	Ivo Sedlacek	V Aleji 42	Jablonec nad Nisou	\N	466 01	Czech Republic	\N
8	IVO	\N	info@savita.cz	\N	\N	\N	Auto-created from order 50	t	2025-04-25 11:51:07.468	2025-04-25 11:51:07.468	IVO	\N	Ivo Sedlacek	V Aleji 42	Jablonec nad Nisou	\N	466 01	Czech Republic	\N
\.


--
-- TOC entry 3474 (class 0 OID 24576)
-- Dependencies: 215
-- Data for Name: session; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.session (sid, sess, expire) FROM stdin;
O__TKB21md_4UnARuFdOx7x6CDf4vPcQ	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-25T17:44:35.270Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-05-27 10:25:16
Bnw3nB5lJ8wlOjhAdVjaON7WLt8ovNic	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-25T13:57:16.121Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-05-25 15:48:45
LVH5kSXeMiATa3umap3M10cXqPOzDL-L	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-25T05:01:47.995Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-05-25 06:59:44
8o7R1oYWjdfcox7_buHPn-V5B0t5b2nD	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-27T11:34:33.626Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-05-27 11:34:53
Ax3Md_qQYMT0t9ZMs0PmMBfHesbM481d	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-25T19:33:02.330Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-05-25 19:38:24
0CA0Jj_-3OQdnOJjJ7W13zlrW-OQGWXl	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-25T19:24:40.616Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-05-25 19:29:43
9JiMDwQCNHikg9i6U0HCUahZo0EUlDc3	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-25T20:23:39.314Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-05-25 20:24:29
nbvf3qombeGOejjyQURlZAfxFAr8_03n	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-25T17:36:45.638Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-05-25 19:24:41
E241VXIpeXl9cOiNGC49yAe5PoIfRwej	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-26T20:39:44.919Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-05-26 20:39:45
NzjZ381Tm94EN5W97mPhRP4PGO6v01Ws	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-25T07:07:39.691Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-05-25 09:58:47
YX2nIpXHOUduA4JK9uGTImEW_s00mLWL	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-25T19:52:31.530Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-05-25 20:03:50
XSqe4HuyP8vg-SNYeqjJKa_HdWRFmo-g	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-24T22:16:42.493Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-05-24 22:47:52
K9L1P-qKibKR4_aY10R3C5VQG6e2oLYv	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-25T10:20:38.904Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-05-25 10:20:39
IWh0IfpfyIcybGX3O2FoDaOS36lrQIUP	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-26T13:39:56.107Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-05-26 13:40:35
L1klEwwfikQnEY8rfe9SE_2Dyg4uQZxr	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-25T20:12:02.195Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-05-25 20:12:59
rLLb6d5CdHF1QErcY3uS3VDnHNSEeTZf	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-25T20:03:23.385Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-05-25 20:04:19
okKueGhNQEYRrx6F5SPqM0JXJYWkaEv_	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-25T19:41:34.761Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-05-25 19:41:35
QL0owKyciJXoNske4MSwyK42ORjlSyYP	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-25T19:59:05.859Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-05-25 19:59:06
Brj6A5u-qL3Cky7uURcyVMUWXZ-G4vSo	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-26T13:45:46.322Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-05-26 13:45:47
45BQX7GqkK_8reUiBu52weiGeiAQlSfd	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-25T19:29:15.532Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-05-25 19:31:08
O1MgR_iEVCz-mDHTrdL6khChK1K6uNhA	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-25T19:45:23.632Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-05-25 19:50:22
P_deb6QFr-02i2Ip-Uvqe7_r2M2hwVVA	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-25T19:44:56.429Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-05-25 19:56:58
4MIe0bFwPX4ZvIuG0dytrWbAcg5Ui84Y	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-27T07:45:38.953Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-05-27 07:45:40
CqwuJ8ckVt5p3bVPqJwGYYzFpe1QROPg	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-25T19:49:54.213Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-05-25 19:53:00
akWTm-8nvbN2b1BMZ8IQR2huAzqpPEaJ	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-25T20:06:33.656Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-05-25 20:18:19
ub6goIp2Bu0Gm0iWR6Bi0dl0AzHVs13S	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-25T20:06:37.598Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-05-25 20:12:04
Hd-P467PCyVwcPrD2BJKW8LtaA2tbs8m	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-25T20:15:14.871Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-05-25 20:23:41
JZCDj2Qtx2au5Gbr0YU4Y_JxYJOtzam1	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-26T17:35:33.574Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-05-26 17:38:03
gAKQKgs01U4qP_WINut8487nsOWkmXTW	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-25T20:12:30.966Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-05-25 20:14:12
_EocDJCE8xZ4lw9C2pB2YBumYRdXAARl	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-25T19:35:04.628Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-05-25 19:45:00
ggS9QhTIS3TCw_9_mokbPb6pi8w2ZPK5	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-26T13:49:31.335Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-05-26 15:16:34
l3qHiRbNbq4iqH4YDy3QsvJAEj4XGHTt	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-25T19:33:06.632Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-05-25 19:35:33
gN7WCvXkW4TIfI6UXughKXtur6ieVETs	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-25T10:20:40.947Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-05-25 13:37:57
N7L3slIF5aMf0G0L3G2H44jn8-bfx3_7	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-26T17:37:32.109Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-05-26 17:37:33
qEHwi4pq754lEGxv_dfTKaXwIMMVFI2z	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-27T19:11:23.850Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-05-27 19:11:24
QMfhzQN4hU1WX7MlHFzsebyDWoBg52qE	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-26T21:40:30.313Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-05-26 23:52:19
73BeX873n9iV60-7p3u9YjQZmhc_TdVh	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-25T19:31:07.099Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-05-25 19:33:35
XIxrM0bhqOgD9dRqEijBtYU7n6rQXpYg	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-27T07:34:01.867Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-05-27 07:34:49
uu-Y6Fgyhy27nBOJHxq8L8wynHxmJbdx	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-26T13:46:06.459Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-05-26 13:46:26
oTSFyptDpTYVW9ERlfgWQBgnJgBw2iSw	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-26T20:39:46.267Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-05-26 21:25:31
Rc0DvqlpcsjpBRY1c45gVuZcJIXaO1Qk	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-25T19:44:58.640Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-05-25 19:45:51
MjSHO4EzUlBIgKy0g9vfY7hzRle88sqD	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-26T17:37:35.868Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-05-27 07:34:30
YtG6RZ05kmiHqOajX_RYB8jroPI3ssrJ	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-27T07:34:38.839Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-05-27 10:15:46
v7ed3DAXudMYgmD0vjXQjEV4gcVIIlsW	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-25T20:13:44.045Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-05-25 20:15:33
CpmbD8kRJYQ80X48w_hvUJBOop_1Z0QW	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-27T18:00:00.339Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-05-27 18:00:01
Hy_FhBtep-4yVCLYmOrXzDjd8_o-uvwc	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-27T18:14:21.262Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-05-27 18:14:22
LmtSmS2T2YH1YQ4mBlE9_4k6f3AB_CGd	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-25T20:04:18.461Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-05-25 20:07:05
9zgZPY_VKfTFHJVgXtxKad2tILq8hCFL	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-27T14:22:27.817Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-05-27 14:26:08
EnRrIue213Yxb-XhN8mfZIUbQv9VlVu-	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-27T13:36:44.096Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-05-27 14:08:45
l711c5lijoRXkZRTfXa2mVImIPQJNCPp	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-27T15:04:34.530Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-05-27 15:21:00
Z-pVNE6nAyUezROze3cJQL_fLeFaW84E	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-27T14:08:42.991Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-05-27 14:16:37
RV498m3rFsDUNYxY71W5HxNvm2-YHytb	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-27T12:00:50.497Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-05-27 13:04:02
REDY01GGeQ817p31axTo2fIWnEU-i9qX	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-27T14:16:35.869Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-05-27 14:22:54
uyNlfx6a-BWWoGJhhJJ4ORXJx6Hr9y0M	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-27T18:00:58.819Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-05-27 18:05:26
Op-_4X8Af9FLronu_KADlmJ5VmVWX9qe	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-27T10:15:45.024Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-05-27 13:36:46
YXVlTo-gIjUSQ-szRFznyerAgcvPF-gl	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-27T14:26:06.150Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-05-27 15:10:15
73b3gPCc7RDnx-ter_xPOzaNviRlC_BK	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-27T15:09:46.762Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-05-27 17:51:42
9ZeNbmCFSgA0Ox4KWq9kbHaHmrtFGgn9	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-27T17:59:15.429Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-05-27 18:01:27
MUvEDZNPy7K7JO-ufKynjojD2GQYcbfJ	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-27T14:01:02.697Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-05-27 14:37:13
ZEKiNO6W41Dvo8NkqP942DFN_K8w96G9	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-27T07:33:57.735Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-05-27 07:33:58
n9ti72NWf2bGRTf_6qV522Ae_UtaPoyB	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-27T15:34:05.647Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-05-27 15:34:25
SZZ0AtI5gIuPh-2_ifQ6BApw2ata9Ehn	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-27T17:57:50.335Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-05-27 17:59:43
rJzawRqBbk98raYgCQjap5jI75YXWthZ	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-27T18:48:41.737Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-05-27 18:50:26
mcBxPhpZwKPmFmqy-zYFn1Wk7l1lN-A0	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-27T18:53:42.632Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-05-28 21:57:25
wiqsbxDSzrvDlcdjfWP0q7anfnOBsWhy	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-27T17:54:41.949Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-05-27 19:05:54
2VAr_nZ3Yv6d-3GTbD9c_CCusmj3gOCi	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-25T07:36:37.200Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-05-29 20:22:50
y3TOSwAkVtHwmHBQ6erARrfYOac3Alnj	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-27T18:13:37.334Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-05-27 18:15:30
Yhu2KApGGrpav9qQpiKJXAn4wJVZZrOG	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-27T19:16:40.935Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-05-27 21:18:21
Px8UCUQJkaWI6HUJlKYis7y86iZuMI2T	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-27T18:15:46.987Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-05-27 18:15:47
aJrRsyL0riKYVav95szcfCpo0SAWaOfS	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-27T17:54:44.442Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-05-27 17:57:52
1kcoNEDa7bzYn4V1gVhcJ5ZEwAZw_Cn_	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-27T18:46:35.896Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-05-27 18:48:43
49z7b2gJh_mKpcB4Krmt9c9uzsL7TODF	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-27T18:33:35.917Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-05-27 18:36:43
DZQS_aLIaWLBdDJuEka-uWCmMH8oeGQB	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-27T17:51:41.447Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-05-27 17:54:46
N8E-wklTBk2fbkciN3Uo_Vckt7gTrTVN	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-27T18:38:52.432Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-05-27 18:40:53
euNqlfAXPFN5A2XZNeVgmlkuwzv5s5YE	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-27T18:40:26.022Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-05-27 18:44:24
-3WogzfnEnBZc0aqBVAGQ3uqe7gOf1Lx	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-27T18:29:05.273Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-05-27 18:30:21
tsuoTtMCPAP7jx04RvuIzuZ7dAehqWCD	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-27T18:30:24.569Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-05-27 18:33:39
xoz0HhFGcRS4kZvu4iPFW4riLfVQN6OJ	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-27T18:15:02.255Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-05-27 18:29:07
4RUqvGBLH_Lz2RM2Q2JusbaN8nXR4BvF	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-28T11:57:15.583Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-05-29 05:46:42
awDAJlu2w__6NLpa5nbvhF2QHGvt7cdQ	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-27T11:27:54.624Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-05-29 19:00:07
kqaM1XNxUXPU7fJsjJionnlXE99_io4b	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-27T18:05:29.109Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-05-27 18:14:05
BTuL0OgJCVf9mpfG4kzpVM8B2hAe5M1E	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-28T19:11:07.879Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-05-28 19:13:53
-mV3ZEJGm8w4AsGi02wBbNBT2Z6QaNUv	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-28T19:54:35.297Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-05-28 19:57:11
z1DViVZlMymjohzfKKuoQA5v4oHnzg0-	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-27T18:49:57.915Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-05-27 18:53:44
JiSUioQNNdXGaHlagZJ7yqQEEt8EPXZO	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-27T18:30:19.827Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-05-27 18:30:25
3dLVgWWS91gp-7GKXt_b7vKghSNBOWY8	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-27T18:36:41.879Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-05-27 18:38:54
GYROcSVRzJO0bBCUhCWQzp4nxZBJKFG7	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-27T18:44:23.154Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-05-27 18:46:37
pdn9lijIS3MWCnbqrlIm5ujAvTSpycoZ	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-25T07:36:12.690Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-05-28 21:48:54
cxNh3Vnwy09DMWea4FrSdlK6UTzkLFXf	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-29T19:11:07.385Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-05-29 20:22:40
0Aa3LHXBKlcxJjkiqhb9Ty0EQuU0M8Ah	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-24T22:19:19.351Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2025-05-29 19:17:25
\.


--
-- TOC entry 3498 (class 0 OID 573504)
-- Dependencies: 239
-- Data for Name: shopify_item_tracking; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) FROM stdin;
62	65	[1]	[{"title": "ZEN flute Large", "suffix": 1, "shopifyLineItemId": "16287161778507"}]	2025-04-29 08:19:50.391	2025-04-29 12:33:32.495
28	30	[1]	[{"title": "Innato Gm3", "suffix": 1, "shopifyLineItemId": "16482960834891"}]	2025-04-29 08:19:20.633	2025-04-29 10:05:38.951
27	29	[1]	[{"title": "Innato Cm4", "suffix": 1, "shopifyLineItemId": "16483464118603"}]	2025-04-29 08:19:20.05	2025-04-29 19:11:19.811
3	3	[1]	[{"title": "Natey Dm4", "suffix": 1, "shopifyLineItemId": "16590850326859"}]	2025-04-29 08:19:05.741	2025-04-29 20:21:06.226
32	34	[1]	[{"title": "Innato Cm4", "suffix": 1, "shopifyLineItemId": "16476326265163"}]	2025-04-29 08:19:23.447	2025-04-29 19:11:22.599
33	35	[1]	[{"title": "Innato Am3", "suffix": 1, "shopifyLineItemId": "16465822089547"}]	2025-04-29 08:19:24.037	2025-04-29 19:11:23.204
16	16	[1]	[{"title": "Natey Am4", "suffix": 1, "shopifyLineItemId": "16537558319435"}]	2025-04-29 08:19:13.364	2025-04-29 20:21:13.546
34	36	[1]	[{"title": "Innato Em4", "suffix": 1, "shopifyLineItemId": "16454601343307"}]	2025-04-29 08:19:24.624	2025-04-29 10:05:42.95
30	32	[1, 2, 3, 4]	[{"title": "Innato Am3", "suffix": 1, "shopifyLineItemId": "16479417991499"}, {"title": "Innato Am3", "suffix": 2, "shopifyLineItemId": "16479418024267"}, {"title": "Innato Em3 (NEW)", "suffix": 3, "shopifyLineItemId": "16479418057035"}, {"title": "Innato G#m3", "suffix": 4, "shopifyLineItemId": "16479418089803"}]	2025-04-29 08:19:21.508	2025-04-29 19:11:20.908
25	27	[1]	[{"title": "Natey G#m4", "suffix": 1, "shopifyLineItemId": "16484188782923"}]	2025-04-29 08:19:18.873	2025-04-29 19:11:18.605
15	15	[1]	[{"title": "Innato Em4", "suffix": 1, "shopifyLineItemId": "16538871071051"}]	2025-04-29 08:19:12.778	2025-04-29 20:21:12.948
31	33	[1, 2, 3, 4]	[{"title": "Innato Am3", "suffix": 1, "shopifyLineItemId": "16479365464395"}, {"title": "Innato Am3", "suffix": 2, "shopifyLineItemId": "16479365497163"}, {"title": "Innato Em3 (NEW)", "suffix": 3, "shopifyLineItemId": "16479365529931"}, {"title": "Innato G#m3", "suffix": 4, "shopifyLineItemId": "16479365562699"}]	2025-04-29 08:19:22.398	2025-04-29 19:11:21.764
19	20	[1]	[{"title": "Natey Cm4", "suffix": 1, "shopifyLineItemId": "16496935403851"}]	2025-04-29 08:19:15.315	2025-04-29 19:11:15.252
66	69	[1]	[{"title": "Innato Bm3", "suffix": 1, "shopifyLineItemId": "16280022876491"}]	2025-04-29 08:19:52.938	2025-04-29 09:34:43.399
7	7	[1]	[{"title": "Innato Dm4", "suffix": 1, "shopifyLineItemId": "16574528029003"}]	2025-04-29 08:19:07.822	2025-04-29 20:21:08.05
20	21	[1]	[{"title": "Innato Dm4", "suffix": 1, "shopifyLineItemId": "16494827569483"}]	2025-04-29 08:19:15.902	2025-04-29 19:11:15.854
4	4	[1]	[{"title": "Natey G#m4", "suffix": 1, "shopifyLineItemId": "16590322794827"}]	2025-04-29 08:19:06.333	2025-04-29 20:21:06.816
2	2	[1]	[{"title": "Innato Em4", "suffix": 1, "shopifyLineItemId": "16601674613067"}]	2025-04-29 08:19:05.142	2025-04-29 20:21:05.613
64	67	[1]	[{"title": "Innato Am3", "suffix": 1, "shopifyLineItemId": "16280410554699"}]	2025-04-29 08:19:51.397	2025-04-29 12:33:33.092
63	66	[1]	[{"title": "Natey G#m4", "suffix": 1, "shopifyLineItemId": "16286573494603"}]	2025-04-29 08:19:50.986	2025-04-29 09:34:41.652
12	12	[1, 2]	[{"title": "Innato Cm4", "suffix": 1, "shopifyLineItemId": "16563508445515"}, {"title": "Innato Fm3", "suffix": 2, "shopifyLineItemId": "16563508478283"}]	2025-04-29 08:19:10.823	2025-04-29 20:21:11.008
13	13	[1]	[{"title": "Innato Bbm3", "suffix": 1, "shopifyLineItemId": "16560707633483"}]	2025-04-29 08:19:11.587	2025-04-29 20:21:11.734
6	6	[1]	[{"title": "ZEN flute Medium", "suffix": 1, "shopifyLineItemId": "16587053236555"}]	2025-04-29 08:19:07.221	2025-04-29 20:21:07.428
11	11	[1]	[{"title": "Innato Bbm3", "suffix": 1, "shopifyLineItemId": "16565789294923"}]	2025-04-29 08:19:10.23	2025-04-29 20:21:10.423
10	10	[1]	[{"title": "Natey Gm3", "suffix": 1, "shopifyLineItemId": "16565900673355"}]	2025-04-29 08:19:09.641	2025-04-29 20:21:09.839
65	68	[1]	[{"title": "ZEN flute Medium", "suffix": 1, "shopifyLineItemId": "16280153489739"}]	2025-04-29 08:19:52.341	2025-04-29 12:33:33.694
24	26	[1]	[{"title": "Natey Am3", "suffix": 1, "shopifyLineItemId": "16486560072011"}]	2025-04-29 08:19:18.285	2025-04-29 19:11:18.005
18	18	[1]	[{"title": "Innato Bm3", "suffix": 1, "shopifyLineItemId": "16509335044427"}]	2025-04-29 08:19:14.435	2025-04-29 19:11:14.174
22	24	[1]	[{"title": "Innato Cm4", "suffix": 1, "shopifyLineItemId": "16492498616651"}]	2025-04-29 08:19:17.074	2025-04-29 19:11:16.812
9	9	[1]	[{"title": "Innato Exploration Cards", "suffix": 1, "shopifyLineItemId": "16568669241675"}]	2025-04-29 08:19:09.011	2025-04-29 20:21:09.249
21	23	[1]	[{"title": "OvA flute C2 64 Hz", "suffix": 1, "shopifyLineItemId": "16494479835467"}]	2025-04-29 08:19:16.655	2025-04-29 10:05:34.931
14	14	[1]	[{"title": "Innato C#m4", "suffix": 1, "shopifyLineItemId": "16550977012043"}]	2025-04-29 08:19:12.184	2025-04-29 20:21:12.342
23	25	[1]	[{"title": "Natey Am4", "suffix": 1, "shopifyLineItemId": "16489221980491"}]	2025-04-29 08:19:17.678	2025-04-29 19:11:17.407
29	31	[1]	[{"title": "Innato Bm3", "suffix": 1, "shopifyLineItemId": "16479462719819"}]	2025-04-29 08:19:21.038	2025-04-29 19:11:20.414
17	17	[1]	[{"title": "Natey Dm4", "suffix": 1, "shopifyLineItemId": "16535593353547"}]	2025-04-29 08:19:13.964	2025-04-29 20:21:14.153
8	8	[1]	[{"title": "ZEN flute Medium", "suffix": 1, "shopifyLineItemId": "16569193529675"}]	2025-04-29 08:19:08.42	2025-04-29 20:21:08.655
26	28	[1]	[{"title": "Innato Em4", "suffix": 1, "shopifyLineItemId": "16483698901323"}]	2025-04-29 08:19:19.461	2025-04-29 19:11:19.203
40	42	[1]	[{"title": "Innato F#m3", "suffix": 1, "shopifyLineItemId": "16404141637963"}]	2025-04-29 08:19:30.346	2025-04-29 19:11:28.556
56	59	[1]	[{"title": "Innato D#m4", "suffix": 1, "shopifyLineItemId": "16301091684683"}]	2025-04-29 08:19:47.649	2025-04-29 09:34:37.822
57	60	[1]	[{"title": "Natey Em4", "suffix": 1, "shopifyLineItemId": "16300628672843"}]	2025-04-29 08:19:48.059	2025-04-29 09:34:38.414
58	61	[1]	[{"title": "Innato Bm3", "suffix": 1, "shopifyLineItemId": "16299404067147"}]	2025-04-29 08:19:48.351	2025-04-29 09:34:38.826
59	62	[1]	[{"title": "Innato D#m4", "suffix": 1, "shopifyLineItemId": "16298778526027"}]	2025-04-29 08:19:48.753	2025-04-29 09:34:39.361
54	57	[1]	[{"title": "Innato Em4", "suffix": 1, "shopifyLineItemId": "16316192784715"}]	2025-04-29 08:19:46.549	2025-04-29 10:06:02.408
42	44	[1]	[{"title": "Innato Am3", "suffix": 1, "shopifyLineItemId": "16396443451723"}]	2025-04-29 08:19:31.366	2025-04-29 19:11:29.169
41	43	[1]	[{"title": "Innato G#m3", "suffix": 1, "shopifyLineItemId": "16398040105291"}]	2025-04-29 08:19:30.942	2025-04-29 10:05:48.84
61	64	[1]	[{"title": "Natey Cm4", "suffix": 1, "shopifyLineItemId": "16287716016459"}]	2025-04-29 08:19:49.964	2025-04-29 09:34:40.534
43	45	[1]	[{"title": "Innato Bbm3", "suffix": 1, "shopifyLineItemId": "16394896343371"}]	2025-04-29 08:19:31.952	2025-04-29 19:11:29.778
44	46	[1]	[{"title": "Innato Em3 (NEW)", "suffix": 1, "shopifyLineItemId": "16391832273227"}]	2025-04-29 08:19:32.534	2025-04-29 19:11:30.385
36	38	[1, 2, 3]	[{"title": "Natey G#m3", "suffix": 1, "shopifyLineItemId": "16452576444747"}, {"title": "ZEN flute Large", "suffix": 2, "shopifyLineItemId": "16452576477515"}, {"title": "Innato C#m4", "suffix": 3, "shopifyLineItemId": "16452576510283"}]	2025-04-29 08:19:27.621	2025-04-29 19:11:25.87
37	39	[1]	[{"title": "Natey Gm3", "suffix": 1, "shopifyLineItemId": "16451904012619"}]	2025-04-29 08:19:28.562	2025-04-29 19:11:26.741
38	40	[1]	[{"title": "Innato Gm3", "suffix": 1, "shopifyLineItemId": "16413836280139"}]	2025-04-29 08:19:29.163	2025-04-29 19:11:27.343
39	41	[1]	[{"title": "ZEN flute Large", "suffix": 1, "shopifyLineItemId": "16407151247691"}]	2025-04-29 08:19:29.752	2025-04-29 19:11:27.947
45	47	[1]	[{"title": "Natey Am4", "suffix": 1, "shopifyLineItemId": "16387493167435"}]	2025-04-29 08:19:33.112	2025-04-29 19:11:30.989
46	48	[1]	[{"title": "Natey C#m4", "suffix": 1, "shopifyLineItemId": "16383812010315"}]	2025-04-29 08:19:33.69	2025-04-29 19:11:31.591
47	49	[1]	[{"title": "Innato Cm4", "suffix": 1, "shopifyLineItemId": "16378485834059"}]	2025-04-29 08:19:34.273	2025-04-29 19:11:32.228
49	51	[1, 2, 3]	[{"title": "Innato C#m4", "suffix": 1, "shopifyLineItemId": "16359653638475"}, {"title": "Double Large Native Gm3", "suffix": 2, "shopifyLineItemId": "16359653671243"}, {"title": "ZEN flute Large", "suffix": 3, "shopifyLineItemId": "16359653704011"}]	2025-04-29 08:19:43.109	2025-04-29 19:11:40.764
50	52	[1]	[{"title": "Innato Am3", "suffix": 1, "shopifyLineItemId": "16348947710283"}]	2025-04-29 08:19:44.166	2025-04-29 19:11:41.612
51	54	[1]	[{"title": "Innato Fm3", "suffix": 1, "shopifyLineItemId": "16341801009483"}]	2025-04-29 08:19:44.75	2025-04-29 19:11:42.222
52	55	[1]	[{"title": "Natey Em4", "suffix": 1, "shopifyLineItemId": "16327780761931"}]	2025-04-29 08:19:45.38	2025-04-29 19:11:42.828
53	56	[1]	[{"title": "Innato Am3", "suffix": 1, "shopifyLineItemId": "16317989617995"}]	2025-04-29 08:19:45.965	2025-04-29 19:11:43.448
55	58	[1]	[{"title": "Innato Exploration Cards", "suffix": 1, "shopifyLineItemId": "16304363110731"}]	2025-04-29 08:19:47.065	2025-04-29 12:33:31.165
60	63	[1, 2]	[{"title": "Innato Exploration Cards", "suffix": 1, "shopifyLineItemId": "16287753863499"}, {"title": "Double Medium Native Bm3", "suffix": 2, "shopifyLineItemId": "16287753896267"}]	2025-04-29 08:19:49.188	2025-04-29 12:33:31.767
80	85	[1]	[{"title": "Natey Dm4", "suffix": 1, "shopifyLineItemId": "16218688815435"}]	2025-04-29 08:19:59.217	2025-04-29 09:34:51.717
81	86	[1]	[{"title": "Innato Am3", "suffix": 1, "shopifyLineItemId": "16214711075147"}]	2025-04-29 08:19:59.622	2025-04-29 09:34:52.252
84	89	[1]	[{"title": "Natey Am4", "suffix": 1, "shopifyLineItemId": "16190725030219"}]	2025-04-29 08:20:01.035	2025-04-29 09:34:53.918
85	90	[1]	[{"title": "Innato Am3", "suffix": 1, "shopifyLineItemId": "16186193477963"}]	2025-04-29 08:20:01.481	2025-04-29 09:34:54.444
86	91	[1]	[{"title": "Natey Am4", "suffix": 1, "shopifyLineItemId": "16185752551755"}]	2025-04-29 08:20:01.892	2025-04-29 09:34:54.983
87	92	[1, 2]	[{"title": "Innato Cm4", "suffix": 1, "shopifyLineItemId": "16185426477387"}, {"title": "Innato Am3", "suffix": 2, "shopifyLineItemId": "16185426510155"}]	2025-04-29 08:20:02.304	2025-04-29 09:34:55.508
88	93	[1]	[{"title": "Innato Am3", "suffix": 1, "shopifyLineItemId": "16178576326987"}]	2025-04-29 08:20:02.722	2025-04-29 09:34:56.035
89	94	[1]	[{"title": "Natey Dm4", "suffix": 1, "shopifyLineItemId": "16176410001739"}]	2025-04-29 08:20:03.125	2025-04-29 09:34:56.569
90	95	[1, 2]	[{"title": "Innato Am3", "suffix": 1, "shopifyLineItemId": "16175632548171"}, {"title": "Double Large Native Am3", "suffix": 2, "shopifyLineItemId": "16175632580939"}]	2025-04-29 08:20:03.537	2025-04-29 09:34:57.095
91	96	[1]	[{"title": "Innato Cm4", "suffix": 1, "shopifyLineItemId": "16171241210187"}]	2025-04-29 08:20:03.948	2025-04-29 09:34:57.63
92	97	[1]	[{"title": "ZEN flute Large", "suffix": 1, "shopifyLineItemId": "16168888664395"}]	2025-04-29 08:20:04.239	2025-04-29 09:34:58.04
93	98	[1]	[{"title": "Double Medium Native Cm4", "suffix": 1, "shopifyLineItemId": "16163895083339"}]	2025-04-29 08:20:04.659	2025-04-29 09:34:58.566
94	99	[1]	[{"title": "Innato Bm3", "suffix": 1, "shopifyLineItemId": "16154851639627"}]	2025-04-29 08:20:05.075	2025-04-29 09:34:59.094
95	100	[1]	[{"title": "Natey Am4", "suffix": 1, "shopifyLineItemId": "16147495420235"}]	2025-04-29 08:20:05.476	2025-04-29 09:34:59.618
96	101	[1]	[{"title": "Natey Am4", "suffix": 1, "shopifyLineItemId": "16144349102411"}]	2025-04-29 08:20:05.879	2025-04-29 09:35:00.145
97	102	[1]	[{"title": "Innato D#m4", "suffix": 1, "shopifyLineItemId": "16136656814411"}]	2025-04-29 08:20:06.301	2025-04-29 09:35:00.676
98	103	[1]	[{"title": "Natey Cm4", "suffix": 1, "shopifyLineItemId": "16133807341899"}]	2025-04-29 08:20:06.708	2025-04-29 09:35:01.201
99	104	[1]	[{"title": "Innato Em4", "suffix": 1, "shopifyLineItemId": "16132327440715"}]	2025-04-29 08:20:07.115	2025-04-29 09:35:01.735
100	105	[1]	[{"title": "Natey Dm4", "suffix": 1, "shopifyLineItemId": "16128012714315"}]	2025-04-29 08:20:07.524	2025-04-29 09:35:02.263
101	106	[1]	[{"title": "Natey Cm4", "suffix": 1, "shopifyLineItemId": "16127474008395"}]	2025-04-29 08:20:07.932	2025-04-29 09:35:02.792
102	107	[1]	[{"title": "Innato Em4", "suffix": 1, "shopifyLineItemId": "16126947295563"}]	2025-04-29 08:20:08.371	2025-04-29 09:35:03.318
103	108	[1]	[{"title": "Natey G#m4", "suffix": 1, "shopifyLineItemId": "16122475446603"}]	2025-04-29 08:20:08.775	2025-04-29 09:35:03.851
104	109	[1]	[{"title": "Double Medium Native Cm4", "suffix": 1, "shopifyLineItemId": "16121755959627"}]	2025-04-29 08:20:09.184	2025-04-29 09:35:04.378
105	110	[1]	[{"title": "Innato Bm3", "suffix": 1, "shopifyLineItemId": "16120158355787"}]	2025-04-29 08:20:09.595	2025-04-29 09:35:04.904
106	111	[1]	[{"title": "Innato Exploration Cards", "suffix": 1, "shopifyLineItemId": "16118867722571"}]	2025-04-29 08:20:10.001	2025-04-29 09:35:05.435
107	112	[1]	[{"title": "Innato Exploration Cards", "suffix": 1, "shopifyLineItemId": "16118797861195"}]	2025-04-29 08:20:10.417	2025-04-29 09:35:05.965
108	113	[1]	[{"title": "ZEN flute Medium", "suffix": 1, "shopifyLineItemId": "16114703204683"}]	2025-04-29 08:20:10.833	2025-04-29 09:35:06.495
109	114	[1]	[{"title": "Innato Em4", "suffix": 1, "shopifyLineItemId": "16114400100683"}]	2025-04-29 08:20:11.247	2025-04-29 09:35:07.021
83	88	[1]	[{"title": "Innato Exploration Cards", "suffix": 1, "shopifyLineItemId": "16207228371275"}]	2025-04-29 08:20:00.445	2025-04-29 12:33:35.264
68	71	[1]	[{"title": "Natey Cm4", "suffix": 1, "shopifyLineItemId": "16274932072779"}]	2025-04-29 08:19:53.876	2025-04-29 09:34:44.474
72	76	[1]	[{"title": "Natey F#m4", "suffix": 1, "shopifyLineItemId": "16256491094347"}]	2025-04-29 08:19:55.805	2025-04-29 09:34:47.07
69	72	[1]	[{"title": "Innato Gm3", "suffix": 1, "shopifyLineItemId": "16272861561163"}]	2025-04-29 08:19:54.282	2025-04-29 09:34:45.002
70	73	[1]	[{"title": "Innato Am3", "suffix": 1, "shopifyLineItemId": "16272313319755"}]	2025-04-29 08:19:54.689	2025-04-29 09:34:45.532
71	74	[1]	[{"title": "Innato Am3", "suffix": 1, "shopifyLineItemId": "16260972970315"}]	2025-04-29 08:19:55.107	2025-04-29 09:34:46.065
1	1	[1]	[{"title": "ZEN flute Large", "suffix": 1, "shopifyLineItemId": "16604072411467"}]	2025-04-29 08:17:02.473	2025-04-29 20:21:05.001
74	79	[1]	[{"title": "Innato Dm4", "suffix": 1, "shopifyLineItemId": "16243056148811"}]	2025-04-29 08:19:56.901	2025-04-29 09:34:48.668
73	77	[1]	[{"title": "Double Medium Native Bbm3", "suffix": 1, "shopifyLineItemId": "16251673641291"}]	2025-04-29 08:19:56.21	2025-04-29 09:34:47.598
75	80	[1]	[{"title": "Innato Cm4", "suffix": 1, "shopifyLineItemId": "16236751061323"}]	2025-04-29 08:19:57.191	2025-04-29 09:34:49.078
76	81	[1]	[{"title": "Innato F#m3", "suffix": 1, "shopifyLineItemId": "16236644499787"}]	2025-04-29 08:19:57.594	2025-04-29 09:34:49.604
78	83	[1]	[{"title": "Innato Am3", "suffix": 1, "shopifyLineItemId": "16220787081547"}]	2025-04-29 08:19:58.402	2025-04-29 09:34:50.662
77	82	[1]	[{"title": "Innato G#m3", "suffix": 1, "shopifyLineItemId": "16224909164875"}]	2025-04-29 08:19:57.997	2025-04-29 09:34:50.13
79	84	[1]	[{"title": "Natey Am3", "suffix": 1, "shopifyLineItemId": "16219798470987"}]	2025-04-29 08:19:58.814	2025-04-29 09:34:51.192
124	129	[1]	[{"title": "Natey Am3", "suffix": 1, "shopifyLineItemId": "16049880793419"}]	2025-04-29 08:20:17.451	2025-04-29 09:35:14.972
125	130	[1]	[{"title": "ZEN flute Large", "suffix": 1, "shopifyLineItemId": "16045845545291"}]	2025-04-29 08:20:17.863	2025-04-29 09:35:15.499
126	131	[1]	[{"title": "Innato Am3", "suffix": 1, "shopifyLineItemId": "16015970369867"}]	2025-04-29 08:20:18.265	2025-04-29 09:35:16.027
127	132	[1, 2]	[{"title": "ZEN flute Medium", "suffix": 1, "shopifyLineItemId": "16006649708875"}, {"title": "ZEN flute Medium", "suffix": 2, "shopifyLineItemId": "16213387084107"}]	2025-04-29 08:20:18.672	2025-04-29 09:35:16.557
128	133	[1, 2]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "16005185962315"}, {"title": "Innato Em4", "suffix": 2, "shopifyLineItemId": "16213385150795"}]	2025-04-29 08:20:19.081	2025-04-29 09:35:17.397
129	134	[1, 2]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15998670209355"}, {"title": "Innato Em4", "suffix": 2, "shopifyLineItemId": "16213381906763"}]	2025-04-29 08:20:19.494	2025-04-29 09:35:17.943
130	135	[1, 2]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15998316216651"}, {"title": "Innato Em4", "suffix": 2, "shopifyLineItemId": "16213379318091"}]	2025-04-29 08:20:19.9	2025-04-29 09:35:18.483
132	137	[1, 2]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15996702982475"}, {"title": "Innato Cm4", "suffix": 2, "shopifyLineItemId": "16213368537419"}]	2025-04-29 08:20:20.992	2025-04-29 09:35:19.636
134	139	[1]	[{"title": "ZENflute", "suffix": 1, "shopifyLineItemId": "15992887312715"}]	2025-04-29 08:20:21.812	2025-04-29 09:35:20.71
135	140	[1, 2]	[{"title": "ZENflute", "suffix": 1, "shopifyLineItemId": "15992856871243"}, {"title": "ZEN flute Medium", "suffix": 2, "shopifyLineItemId": "16213347500363"}]	2025-04-29 08:20:22.226	2025-04-29 09:35:21.265
136	141	[1, 2]	[{"title": "ZENflute", "suffix": 1, "shopifyLineItemId": "15992513986891"}, {"title": "ZEN flute Medium", "suffix": 2, "shopifyLineItemId": "16213345534283"}]	2025-04-29 08:20:22.636	2025-04-29 09:35:21.804
137	142	[1, 2]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15990878536011"}, {"title": "Innato Gm3", "suffix": 2, "shopifyLineItemId": "16213343732043"}]	2025-04-29 08:20:23.038	2025-04-29 09:35:22.347
138	143	[1, 2]	[{"title": "ZENflute", "suffix": 1, "shopifyLineItemId": "15989787492683"}, {"title": "ZEN flute Medium", "suffix": 2, "shopifyLineItemId": "16213341077835"}]	2025-04-29 08:20:23.452	2025-04-29 09:35:22.888
139	144	[1, 2]	[{"title": "ZENflute", "suffix": 1, "shopifyLineItemId": "15989624701259"}, {"title": "ZEN flute Medium", "suffix": 2, "shopifyLineItemId": "16213338259787"}]	2025-04-29 08:20:23.877	2025-04-29 09:35:23.425
140	145	[1, 2]	[{"title": "Natey flute", "suffix": 1, "shopifyLineItemId": "15988959805771"}, {"title": "Natey Gm4", "suffix": 2, "shopifyLineItemId": "16213335540043"}]	2025-04-29 08:20:24.283	2025-04-29 09:35:23.964
141	146	[1, 2, 3, 4]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15986700910923"}, {"title": "Innato flute", "suffix": 2, "shopifyLineItemId": "15986700943691"}, {"title": "Innato Dm4", "suffix": 3, "shopifyLineItemId": "16213331378507"}, {"title": "Innato Bm3", "suffix": 4, "shopifyLineItemId": "16213331411275"}]	2025-04-29 08:20:24.589	2025-04-29 09:35:24.387
142	147	[1, 2]	[{"title": "Natey flute", "suffix": 1, "shopifyLineItemId": "15976733704523"}, {"title": "Natey Cm4", "suffix": 2, "shopifyLineItemId": "16213321253195"}]	2025-04-29 08:20:25.009	2025-04-29 09:35:25.57
131	136	[1, 2]	[{"title": "Natey flute", "suffix": 1, "shopifyLineItemId": "15996937732427"}, {"title": "Natey Gm3", "suffix": 2, "shopifyLineItemId": "16213377745227"}]	2025-04-29 08:20:20.301	2025-04-29 12:33:35.857
111	116	[1]	[{"title": "Innato Cm4", "suffix": 1, "shopifyLineItemId": "16107443061067"}]	2025-04-29 08:20:12.06	2025-04-29 09:35:08.154
112	117	[1]	[{"title": "Innato Exploration Cards", "suffix": 1, "shopifyLineItemId": "16106027385163"}]	2025-04-29 08:20:12.476	2025-04-29 09:35:08.68
113	118	[1]	[{"title": "Innato Cm4", "suffix": 1, "shopifyLineItemId": "16103753384267"}]	2025-04-29 08:20:12.902	2025-04-29 09:35:09.206
114	119	[1]	[{"title": "Innato Cm4", "suffix": 1, "shopifyLineItemId": "16103637844299"}]	2025-04-29 08:20:13.437	2025-04-29 09:35:09.736
115	120	[1]	[{"title": "Innato Bbm3", "suffix": 1, "shopifyLineItemId": "16097090044235"}]	2025-04-29 08:20:13.856	2025-04-29 09:35:10.262
116	121	[1]	[{"title": "Innato Cm4", "suffix": 1, "shopifyLineItemId": "16089825804619"}]	2025-04-29 08:20:14.276	2025-04-29 09:35:10.786
118	123	[1]	[{"title": "Innato Bbm3", "suffix": 1, "shopifyLineItemId": "16087829971275"}]	2025-04-29 08:20:15.102	2025-04-29 09:35:11.914
119	124	[1]	[{"title": "Innato Exploration Cards", "suffix": 1, "shopifyLineItemId": "16087208067403"}]	2025-04-29 08:20:15.504	2025-04-29 09:35:12.444
120	125	[1]	[{"title": "Innato Exploration Cards", "suffix": 1, "shopifyLineItemId": "16084941472075"}]	2025-04-29 08:20:15.923	2025-04-29 09:35:12.976
121	126	[1]	[{"title": "Innato Cm4", "suffix": 1, "shopifyLineItemId": "16075554226507"}]	2025-04-29 08:20:16.215	2025-04-29 09:35:13.386
122	127	[1]	[{"title": "Innato Bm3", "suffix": 1, "shopifyLineItemId": "16064974750027"}]	2025-04-29 08:20:16.626	2025-04-29 09:35:13.913
123	128	[1, 2]	[{"title": "Innato Am3", "suffix": 1, "shopifyLineItemId": "16059437777227"}, {"title": "Innato Cm4", "suffix": 2, "shopifyLineItemId": "16059437809995"}]	2025-04-29 08:20:17.041	2025-04-29 09:35:14.438
5	5	[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]	[{"title": "Natey Am3", "suffix": 1, "shopifyLineItemId": "16590182383947"}, {"title": "Natey Am3", "suffix": 2, "shopifyLineItemId": "16590182416715"}, {"title": "Natey Am3", "suffix": 3, "shopifyLineItemId": "16590182449483"}, {"title": "Natey Am3", "suffix": 4, "shopifyLineItemId": "16590182482251"}, {"title": "Natey Bm3", "suffix": 5, "shopifyLineItemId": "16590182515019"}, {"title": "Natey Bm3", "suffix": 6, "shopifyLineItemId": "16590182547787"}, {"title": "Natey Cm4", "suffix": 7, "shopifyLineItemId": "16590182580555"}, {"title": "Natey Cm4", "suffix": 8, "shopifyLineItemId": "16590182613323"}, {"title": "Natey Cm4", "suffix": 9, "shopifyLineItemId": "16590182646091"}, {"title": "Natey Dm4", "suffix": 10, "shopifyLineItemId": "16590182678859"}, {"title": "Natey Dm4", "suffix": 11, "shopifyLineItemId": "16590182711627"}, {"title": "Natey Fm4", "suffix": 12, "shopifyLineItemId": "16590182744395"}, {"title": "Natey Gm4", "suffix": 13, "shopifyLineItemId": "16590182777163"}, {"title": "Natey Gm4", "suffix": 14, "shopifyLineItemId": "16590182809931"}, {"title": "Natey Gm4", "suffix": 15, "shopifyLineItemId": "16590182842699"}, {"title": "Natey Am4", "suffix": 16, "shopifyLineItemId": "16590182875467"}, {"title": "Natey Am4", "suffix": 17, "shopifyLineItemId": "16590182908235"}, {"title": "Natey Bm3", "suffix": 18, "shopifyLineItemId": "16597662925131"}, {"title": "Natey Dm4", "suffix": 19, "shopifyLineItemId": "16597662957899"}, {"title": "Natey Am4", "suffix": 20, "shopifyLineItemId": "16597662990667"}]	2025-04-29 08:19:06.815	2025-04-29 10:05:22.105
144	149	[1]	[{"title": "Innato Am3", "suffix": 1, "shopifyLineItemId": "15971176710475"}]	2025-04-29 08:20:25.709	2025-04-29 09:35:26.524
162	168	[1]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15887939305803"}]	2025-04-29 08:20:33.559	2025-04-29 09:19:15.654
147	152	[1, 2]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15964495511883"}, {"title": "Innato Bbm3", "suffix": 2, "shopifyLineItemId": "16213308080459"}]	2025-04-29 08:20:26.798	2025-04-29 09:35:37.4
148	153	[1]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15963031601483"}]	2025-04-29 08:20:27.206	2025-04-29 09:35:37.936
153	158	[1]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15937544061259"}]	2025-04-29 08:20:29.227	2025-04-29 09:19:10.664
163	169	[1]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15885253706059"}]	2025-04-29 08:20:33.966	2025-04-29 09:19:16.122
164	170	[1]	[{"title": "ZENflute", "suffix": 1, "shopifyLineItemId": "15876858118475"}]	2025-04-29 08:20:34.257	2025-04-29 09:19:16.468
165	171	[1]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15871253053771"}]	2025-04-29 08:20:34.663	2025-04-29 09:19:16.929
167	173	[1]	[{"title": "Natey flute", "suffix": 1, "shopifyLineItemId": "15855481258315"}]	2025-04-29 08:20:35.367	2025-04-29 09:19:20.41
206	213	[1]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15730776768843"}]	2025-04-29 08:20:51.82	2025-04-29 09:19:42.21
149	154	[1, 2, 3]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15962671579467"}, {"title": "Natey flute", "suffix": 2, "shopifyLineItemId": "15962671612235"}, {"title": "Double flute", "suffix": 3, "shopifyLineItemId": "15962671645003"}]	2025-04-29 08:20:27.608	2025-04-29 09:35:38.46
150	155	[1]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15954222219595"}]	2025-04-29 08:20:28.017	2025-04-29 09:35:38.986
151	156	[1]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15951564570955"}]	2025-04-29 08:20:28.423	2025-04-29 09:35:39.51
152	157	[1]	[{"title": "Natey flute", "suffix": 1, "shopifyLineItemId": "15942265504075"}]	2025-04-29 08:20:28.823	2025-04-29 09:35:40.046
154	159	[1]	[{"title": "Innato Am", "suffix": 1, "shopifyLineItemId": "15932549890379"}]	2025-04-29 08:20:29.63	2025-04-29 09:19:11.134
155	160	[1]	[{"title": "Natey flute", "suffix": 1, "shopifyLineItemId": "15913579118923"}]	2025-04-29 08:20:30.033	2025-04-29 09:19:11.598
156	161	[1, 2]	[{"title": "Natey flute", "suffix": 1, "shopifyLineItemId": "15910735216971"}, {"title": "Innato flute", "suffix": 2, "shopifyLineItemId": "15910735249739"}]	2025-04-29 08:20:30.433	2025-04-29 09:19:12.07
157	162	[1, 2]	[{"title": "Natey flute", "suffix": 1, "shopifyLineItemId": "15903846531403"}, {"title": "Natey flute", "suffix": 2, "shopifyLineItemId": "15903846564171"}]	2025-04-29 08:20:30.844	2025-04-29 09:19:12.59
207	214	[1]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15729909006667"}]	2025-04-29 08:20:52.14	2025-04-29 09:19:42.566
158	163	[1]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15902911529291"}]	2025-04-29 08:20:31.248	2025-04-29 09:19:13.232
159	164	[1]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15891093193035"}]	2025-04-29 08:20:31.659	2025-04-29 09:19:13.704
160	165	[1]	[{"title": "Natey flute", "suffix": 1, "shopifyLineItemId": "15890931351883"}]	2025-04-29 08:20:32.064	2025-04-29 09:19:14.17
161	167	[1]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15889176920395"}]	2025-04-29 08:20:33.274	2025-04-29 09:19:15.219
208	215	[1]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15729000710475"}]	2025-04-29 08:20:52.551	2025-04-29 09:19:43.073
209	216	[1]	[{"title": "Natey flute", "suffix": 1, "shopifyLineItemId": "15722619896139"}]	2025-04-29 08:20:53.084	2025-04-29 09:19:43.552
143	148	[1]	[{"title": "Natey flute", "suffix": 1, "shopifyLineItemId": "15976615805259"}]	2025-04-29 08:20:25.408	2025-04-29 09:35:26.11
184	191	[1]	[{"title": "Natey flute", "suffix": 1, "shopifyLineItemId": "15797768651083"}]	2025-04-29 08:20:42.721	2025-04-29 09:19:31.533
186	193	[1]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15792084418891"}]	2025-04-29 08:20:43.55	2025-04-29 09:19:32.488
187	194	[1]	[{"title": "Natey flute", "suffix": 1, "shopifyLineItemId": "15792025010507"}]	2025-04-29 08:20:43.966	2025-04-29 09:19:32.962
188	195	[1]	[{"title": "ZENflute", "suffix": 1, "shopifyLineItemId": "15791899705675"}]	2025-04-29 08:20:44.385	2025-04-29 09:19:33.432
189	196	[1]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15786736615755"}]	2025-04-29 08:20:44.819	2025-04-29 09:19:33.913
190	197	[1]	[{"title": "Double flute", "suffix": 1, "shopifyLineItemId": "15780854006091"}]	2025-04-29 08:20:45.231	2025-04-29 09:19:34.402
191	198	[1]	[{"title": "Natey flute", "suffix": 1, "shopifyLineItemId": "15780201890123"}]	2025-04-29 08:20:45.656	2025-04-29 09:19:34.881
192	199	[1]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15773655531851"}]	2025-04-29 08:20:46.07	2025-04-29 09:19:35.361
193	200	[1]	[{"title": "Natey flute", "suffix": 1, "shopifyLineItemId": "15773003841867"}]	2025-04-29 08:20:46.487	2025-04-29 09:19:35.835
194	201	[1, 2]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15770865697099"}, {"title": "Natey flute", "suffix": 2, "shopifyLineItemId": "15770865729867"}]	2025-04-29 08:20:46.895	2025-04-29 09:19:36.306
195	202	[1]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15769382879563"}]	2025-04-29 08:20:47.312	2025-04-29 09:19:36.86
196	203	[1]	[{"title": "Natey flute", "suffix": 1, "shopifyLineItemId": "15769350242635"}]	2025-04-29 08:20:47.608	2025-04-29 09:19:37.224
197	204	[1]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15762788516171"}]	2025-04-29 08:20:48.022	2025-04-29 09:19:37.701
198	205	[1]	[{"title": "ZENflute", "suffix": 1, "shopifyLineItemId": "15757009027403"}]	2025-04-29 08:20:48.441	2025-04-29 09:19:38.172
199	206	[1, 2]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15748620255563"}, {"title": "Natey flute", "suffix": 2, "shopifyLineItemId": "15748620288331"}]	2025-04-29 08:20:48.858	2025-04-29 09:19:38.646
200	207	[1]	[{"title": "Natey flute", "suffix": 1, "shopifyLineItemId": "15747208511819"}]	2025-04-29 08:20:49.28	2025-04-29 09:19:39.178
201	208	[1]	[{"title": "Natey flute", "suffix": 1, "shopifyLineItemId": "15746665611595"}]	2025-04-29 08:20:49.694	2025-04-29 09:19:39.655
202	209	[1]	[{"title": "Natey flute", "suffix": 1, "shopifyLineItemId": "15742342365515"}]	2025-04-29 08:20:50.115	2025-04-29 09:19:40.136
203	210	[1]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15741341827403"}]	2025-04-29 08:20:50.539	2025-04-29 09:19:40.642
204	211	[1]	[{"title": "Double flute", "suffix": 1, "shopifyLineItemId": "15740496380235"}]	2025-04-29 08:20:50.957	2025-04-29 09:19:41.119
205	212	[1]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15733486223691"}]	2025-04-29 08:20:51.388	2025-04-29 09:19:41.722
169	175	[1]	[{"title": "ZENflute", "suffix": 1, "shopifyLineItemId": "15851750981963"}]	2025-04-29 08:20:36.063	2025-04-29 09:19:23.478
170	176	[1]	[{"title": "Natey flute", "suffix": 1, "shopifyLineItemId": "15850810933579"}]	2025-04-29 08:20:36.468	2025-04-29 09:19:23.949
171	177	[1, 2, 3]	[{"title": "Natey flute", "suffix": 1, "shopifyLineItemId": "15849788604747"}, {"title": "Double flute", "suffix": 2, "shopifyLineItemId": "15849788637515"}, {"title": "Double flute", "suffix": 3, "shopifyLineItemId": "15849788670283"}]	2025-04-29 08:20:36.87	2025-04-29 09:19:24.44
172	179	[1]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15839436046667"}]	2025-04-29 08:20:37.872	2025-04-29 09:19:25.933
174	181	[1]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15836066480459"}]	2025-04-29 08:20:38.582	2025-04-29 09:19:26.771
175	182	[1]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15834791870795"}]	2025-04-29 08:20:38.998	2025-04-29 09:19:27.245
173	180	[1]	[{"title": "ZENflute", "suffix": 1, "shopifyLineItemId": "15837330407755"}]	2025-04-29 08:20:38.168	2025-04-29 09:19:26.29
176	183	[1, 2]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15834255786315"}, {"title": "Double flute", "suffix": 2, "shopifyLineItemId": "15834255819083"}]	2025-04-29 08:20:39.418	2025-04-29 09:19:27.725
177	184	[1]	[{"title": "Natey flute", "suffix": 1, "shopifyLineItemId": "15833908019531"}]	2025-04-29 08:20:39.836	2025-04-29 09:19:28.259
178	185	[1]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15833835372875"}]	2025-04-29 08:20:40.13	2025-04-29 09:19:28.615
179	186	[1]	[{"title": "Natey flute", "suffix": 1, "shopifyLineItemId": "15824217997643"}]	2025-04-29 08:20:40.552	2025-04-29 09:19:29.09
180	187	[1]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15822624915787"}]	2025-04-29 08:20:40.966	2025-04-29 09:19:29.589
181	188	[1]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15817581166923"}]	2025-04-29 08:20:41.4	2025-04-29 09:19:30.074
182	189	[1]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15805652795723"}]	2025-04-29 08:20:41.824	2025-04-29 09:19:30.567
183	190	[1]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15800601248075"}]	2025-04-29 08:20:42.244	2025-04-29 09:19:31.058
185	192	[1]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15797751775563"}]	2025-04-29 08:20:43.137	2025-04-29 09:19:32.008
67	70	[1]	[{"title": "Double Medium Native Cm4", "suffix": 1, "shopifyLineItemId": "16277852488011"}]	2025-04-29 08:19:53.446	2025-04-29 09:34:43.938
220	227	[1]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15673284067659"}]	2025-04-29 08:20:57.603	2025-04-29 09:19:48.883
221	228	[1]	[{"title": "Natey flute", "suffix": 1, "shopifyLineItemId": "15669203403083"}]	2025-04-29 08:20:58.025	2025-04-29 09:19:49.365
222	229	[1]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15666385355083"}]	2025-04-29 08:20:58.447	2025-04-29 09:19:49.851
223	230	[1]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15656859861323"}]	2025-04-29 08:20:58.87	2025-04-29 09:19:50.331
224	231	[1]	[{"title": "Natey flute", "suffix": 1, "shopifyLineItemId": "15622824821067"}]	2025-04-29 08:20:59.284	2025-04-29 09:19:50.81
225	232	[1]	[{"title": "Natey flute", "suffix": 1, "shopifyLineItemId": "15619733487947"}]	2025-04-29 08:20:59.701	2025-04-29 09:19:51.321
226	233	[1]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15619165946187"}]	2025-04-29 08:21:00.113	2025-04-29 09:19:51.8
227	234	[1]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15619161588043"}]	2025-04-29 08:21:00.534	2025-04-29 09:19:52.276
228	235	[1]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15617467908427"}]	2025-04-29 08:21:00.837	2025-04-29 09:19:52.648
229	236	[1]	[{"title": "Double flute", "suffix": 1, "shopifyLineItemId": "15614478713163"}]	2025-04-29 08:21:01.25	2025-04-29 09:19:53.123
230	237	[1]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15605984198987"}]	2025-04-29 08:21:01.717	2025-04-29 09:19:53.602
231	238	[1]	[{"title": "Double flute", "suffix": 1, "shopifyLineItemId": "15603595444555"}]	2025-04-29 08:21:02.135	2025-04-29 09:19:54.074
232	239	[1]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15601654169931"}]	2025-04-29 08:21:02.552	2025-04-29 09:19:54.561
233	240	[1]	[{"title": "Natey flute", "suffix": 1, "shopifyLineItemId": "15592179106123"}]	2025-04-29 08:21:02.969	2025-04-29 09:19:55.046
234	241	[1]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15586594652491"}]	2025-04-29 08:21:03.41	2025-04-29 09:19:55.53
235	242	[1]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15581256450379"}]	2025-04-29 08:21:03.842	2025-04-29 09:19:56.01
236	243	[1]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15578685440331"}]	2025-04-29 08:21:04.261	2025-04-29 09:19:56.489
237	244	[1]	[{"title": "Natey flute", "suffix": 1, "shopifyLineItemId": "15571644318027"}]	2025-04-29 08:21:04.857	2025-04-29 09:19:57.087
238	245	[1]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15571035226443"}]	2025-04-29 08:21:05.154	2025-04-29 09:19:57.449
239	246	[1]	[{"title": "Natey flute", "suffix": 1, "shopifyLineItemId": "15565398868299"}]	2025-04-29 08:21:05.577	2025-04-29 09:19:57.942
240	247	[1]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15561855992139"}]	2025-04-29 08:21:05.873	2025-04-29 09:19:58.313
241	248	[1, 2]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15557280727371"}, {"title": "ZENflute", "suffix": 2, "shopifyLineItemId": "15557280760139"}]	2025-04-29 08:21:06.285	2025-04-29 09:19:58.783
242	249	[1, 2]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15553277428043"}, {"title": "Innato flute", "suffix": 2, "shopifyLineItemId": "15553941111115"}]	2025-04-29 08:21:06.703	2025-04-29 09:19:59.321
243	250	[1]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15550836867403"}]	2025-04-29 08:21:07.12	2025-04-29 09:19:59.868
244	251	[1]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15547257061707"}]	2025-04-29 08:21:07.538	2025-04-29 09:20:00.373
213	220	[1]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15707752661323"}]	2025-04-29 08:20:54.637	2025-04-29 09:19:45.45
214	221	[1]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15700281000267"}]	2025-04-29 08:20:55.054	2025-04-29 09:19:45.927
216	223	[1]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15695693349195"}]	2025-04-29 08:20:55.891	2025-04-29 09:19:46.89
217	224	[1]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15695135670603"}]	2025-04-29 08:20:56.323	2025-04-29 09:19:47.374
218	225	[1]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15688235974987"}]	2025-04-29 08:20:56.743	2025-04-29 09:19:47.862
219	226	[1]	[{"title": "ZENflute", "suffix": 1, "shopifyLineItemId": "15675494662475"}]	2025-04-29 08:20:57.164	2025-04-29 09:19:48.342
110	115	[1]	[{"title": "Innato Exploration Cards", "suffix": 1, "shopifyLineItemId": "16113670685003"}]	2025-04-29 08:20:11.651	2025-04-29 09:35:07.609
117	122	[1, 2]	[{"title": "Double Medium Native Cm4", "suffix": 1, "shopifyLineItemId": "16087865262411"}, {"title": "Double Medium Native C#m4", "suffix": 2, "shopifyLineItemId": "16093147103563"}]	2025-04-29 08:20:14.683	2025-04-29 09:35:11.31
212	219	[1]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15710550425931"}]	2025-04-29 08:20:54.221	2025-04-29 09:19:44.958
215	222	[1]	[{"title": "Natey flute", "suffix": 1, "shopifyLineItemId": "15695880847691"}]	2025-04-29 08:20:55.47	2025-04-29 09:19:46.401
246	254	[1]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15546607239499"}]	2025-04-29 08:21:08.311	2025-04-29 09:20:03.388
280	288	[1]	[{"title": "Natey flute", "suffix": 1, "shopifyLineItemId": "15445813395787"}]	2025-04-29 08:21:22.213	2025-04-29 09:20:21.894
211	218	[1]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15712393724235"}]	2025-04-29 08:20:53.924	2025-04-29 09:19:44.593
245	253	[1]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15546613203275"}]	2025-04-29 08:21:08.019	2025-04-29 09:20:03.037
281	289	[1]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15444360757579"}]	2025-04-29 08:21:22.632	2025-04-29 09:20:22.408
276	284	[1]	[{"title": "Natey flute", "suffix": 1, "shopifyLineItemId": "15450854195531"}]	2025-04-29 08:21:20.528	2025-04-29 09:20:20.009
266	274	[1]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15464362312011"}]	2025-04-29 08:21:16.395	2025-04-29 09:20:14.588
256	264	[1]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15507998605643"}]	2025-04-29 08:21:12.43	2025-04-29 09:20:10.113
267	275	[1]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15463898972491"}]	2025-04-29 08:21:16.816	2025-04-29 09:20:15.061
257	265	[1]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15504528507211"}]	2025-04-29 08:21:12.843	2025-04-29 09:20:10.579
258	266	[1]	[{"title": "ZENflute", "suffix": 1, "shopifyLineItemId": "15494796837195"}]	2025-04-29 08:21:13.267	2025-04-29 09:20:11.054
277	285	[1]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15450549256523"}]	2025-04-29 08:21:20.941	2025-04-29 09:20:20.476
278	286	[1]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15449787892043"}]	2025-04-29 08:21:21.37	2025-04-29 09:20:20.949
279	287	[1]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15447606853963"}]	2025-04-29 08:21:21.795	2025-04-29 09:20:21.42
248	256	[1]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15534406959435"}]	2025-04-29 08:21:09.026	2025-04-29 09:20:06.294
249	257	[1]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15528573960523"}]	2025-04-29 08:21:09.439	2025-04-29 09:20:06.762
250	258	[1]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15526147227979"}]	2025-04-29 08:21:09.851	2025-04-29 09:20:07.244
251	259	[1]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15524037001547"}]	2025-04-29 08:21:10.26	2025-04-29 09:20:07.711
252	260	[1]	[{"title": "Natey flute", "suffix": 1, "shopifyLineItemId": "15523134931275"}]	2025-04-29 08:21:10.671	2025-04-29 09:20:08.179
259	267	[1]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15494680084811"}]	2025-04-29 08:21:13.681	2025-04-29 09:20:11.526
268	276	[1]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15463185645899"}]	2025-04-29 08:21:17.241	2025-04-29 09:20:15.531
269	277	[1]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15462874841419"}]	2025-04-29 08:21:17.548	2025-04-29 09:20:15.889
270	278	[1]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15460370186571"}]	2025-04-29 08:21:18.009	2025-04-29 09:20:16.357
272	280	[1]	[{"title": "Natey flute", "suffix": 1, "shopifyLineItemId": "15452662694219"}]	2025-04-29 08:21:18.851	2025-04-29 09:20:18.013
260	268	[1]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15492162486603"}]	2025-04-29 08:21:13.978	2025-04-29 09:20:11.876
273	281	[1]	[{"title": "Natey flute", "suffix": 1, "shopifyLineItemId": "15452044493131"}]	2025-04-29 08:21:19.266	2025-04-29 09:20:18.48
261	269	[1]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15489657930059"}]	2025-04-29 08:21:14.275	2025-04-29 09:20:12.227
274	282	[1]	[{"title": "ZENflute", "suffix": 1, "shopifyLineItemId": "15451647213899"}]	2025-04-29 08:21:19.689	2025-04-29 09:20:18.947
262	270	[1]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15481838993739"}]	2025-04-29 08:21:14.696	2025-04-29 09:20:12.697
263	271	[1]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15481246515531"}]	2025-04-29 08:21:15.129	2025-04-29 09:20:13.17
253	261	[1]	[{"title": "Natey flute", "suffix": 1, "shopifyLineItemId": "15521089126731"}]	2025-04-29 08:21:11.161	2025-04-29 09:20:08.703
264	272	[1]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15476475789643"}]	2025-04-29 08:21:15.542	2025-04-29 09:20:13.639
254	262	[1]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15515681915211"}]	2025-04-29 08:21:11.587	2025-04-29 09:20:09.172
265	273	[1]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15475045433675"}]	2025-04-29 08:21:15.978	2025-04-29 09:20:14.109
275	283	[1, 2, 3]	[{"title": "Double flute", "suffix": 1, "shopifyLineItemId": "15451487371595"}, {"title": "Innato flute", "suffix": 2, "shopifyLineItemId": "15451487404363"}, {"title": "Natey flute", "suffix": 3, "shopifyLineItemId": "15451487437131"}]	2025-04-29 08:21:20.107	2025-04-29 09:20:19.415
255	263	[1]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15513683394891"}]	2025-04-29 08:21:12.007	2025-04-29 09:20:09.64
303	311	[1]	[{"title": "ZENflute", "suffix": 1, "shopifyLineItemId": "15385543180619"}]	2025-04-29 08:21:31.727	2025-04-29 09:20:32.802
304	312	[1]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15382562275659"}]	2025-04-29 08:21:32.145	2025-04-29 09:20:33.275
305	313	[1]	[{"title": "Natey flute", "suffix": 1, "shopifyLineItemId": "15382428287307"}]	2025-04-29 08:21:32.555	2025-04-29 09:20:33.771
286	294	[1]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15424619544907"}]	2025-04-29 08:21:24.752	2025-04-29 09:20:24.753
287	295	[1]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15420929179979"}]	2025-04-29 08:21:25.173	2025-04-29 09:20:25.233
288	296	[1]	[{"title": "Double flute", "suffix": 1, "shopifyLineItemId": "15416337498443"}]	2025-04-29 08:21:25.592	2025-04-29 09:20:25.702
289	297	[1]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15416289067339"}]	2025-04-29 08:21:26.004	2025-04-29 09:20:26.297
290	298	[1]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15416053399883"}]	2025-04-29 08:21:26.435	2025-04-29 09:20:26.764
291	299	[1]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15409046782283"}]	2025-04-29 08:21:26.858	2025-04-29 09:20:27.234
292	300	[1]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15407625404747"}]	2025-04-29 08:21:27.281	2025-04-29 09:20:27.701
293	301	[1]	[{"title": "Natey flute", "suffix": 1, "shopifyLineItemId": "15403478974795"}]	2025-04-29 08:21:27.706	2025-04-29 09:20:28.17
294	302	[1]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15401476817227"}]	2025-04-29 08:21:28.124	2025-04-29 09:20:28.636
295	303	[1]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15401154478411"}]	2025-04-29 08:21:28.543	2025-04-29 09:20:29.104
296	304	[1]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15397710168395"}]	2025-04-29 08:21:28.954	2025-04-29 09:20:29.572
297	305	[1, 2]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15397406572875"}, {"title": "Innato flute", "suffix": 2, "shopifyLineItemId": "15397406605643"}]	2025-04-29 08:21:29.367	2025-04-29 09:20:30.052
282	290	[1]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15443331187019"}]	2025-04-29 08:21:23.045	2025-04-29 09:20:22.876
283	291	[1]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15441869242699"}]	2025-04-29 08:21:23.475	2025-04-29 09:20:23.344
284	292	[1]	[{"title": "Natey flute", "suffix": 1, "shopifyLineItemId": "15431434404171"}]	2025-04-29 08:21:23.891	2025-04-29 09:20:23.815
285	293	[1]	[{"title": "Natey flute", "suffix": 1, "shopifyLineItemId": "15431315194187"}]	2025-04-29 08:21:24.343	2025-04-29 09:20:24.284
298	306	[1]	[{"title": "Natey flute", "suffix": 1, "shopifyLineItemId": "15391961448779"}]	2025-04-29 08:21:29.786	2025-04-29 09:20:30.58
299	307	[1]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15389577118027"}]	2025-04-29 08:21:30.199	2025-04-29 09:20:31.046
300	308	[1]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15388848357707"}]	2025-04-29 08:21:30.493	2025-04-29 09:20:31.397
301	309	[1]	[{"title": "ZENflute", "suffix": 1, "shopifyLineItemId": "15388555542859"}]	2025-04-29 08:21:30.909	2025-04-29 09:20:31.869
302	310	[1]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15386248282443"}]	2025-04-29 08:21:31.319	2025-04-29 09:20:32.334
210	217	[1, 2]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15713627865419"}, {"title": "Innato flute", "suffix": 2, "shopifyLineItemId": "15713627898187"}]	2025-04-29 08:20:53.494	2025-04-29 09:19:44.038
82	87	[1, 2]	[{"title": "Natey F#m4", "suffix": 1, "shopifyLineItemId": "16211370213707"}, {"title": "Double Medium Native Bm3", "suffix": 2, "shopifyLineItemId": "16211370246475"}]	2025-04-29 08:20:00.028	2025-04-29 09:34:52.781
145	150	[1, 2]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15969020838219"}, {"title": "Innato Cm4", "suffix": 2, "shopifyLineItemId": "16213310472523"}]	2025-04-29 08:20:26.109	2025-04-29 09:35:27.066
168	174	[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15853111083339"}, {"title": "Innato flute", "suffix": 2, "shopifyLineItemId": "15853111116107"}, {"title": "Innato flute", "suffix": 3, "shopifyLineItemId": "15853111148875"}, {"title": "Innato flute", "suffix": 4, "shopifyLineItemId": "15853111181643"}, {"title": "Innato flute", "suffix": 5, "shopifyLineItemId": "15853111214411"}, {"title": "Innato flute", "suffix": 6, "shopifyLineItemId": "15853111247179"}, {"title": "Innato flute", "suffix": 7, "shopifyLineItemId": "15853111279947"}, {"title": "Innato flute", "suffix": 8, "shopifyLineItemId": "15853111312715"}, {"title": "Innato flute", "suffix": 9, "shopifyLineItemId": "15853111345483"}, {"title": "Innato flute", "suffix": 10, "shopifyLineItemId": "15853111378251"}]	2025-04-29 08:20:35.656	2025-04-29 09:19:20.858
271	279	[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15454522540363"}, {"title": "Innato flute", "suffix": 2, "shopifyLineItemId": "15454522573131"}, {"title": "Innato flute", "suffix": 3, "shopifyLineItemId": "15454522605899"}, {"title": "Innato flute", "suffix": 4, "shopifyLineItemId": "15454522638667"}, {"title": "Innato flute", "suffix": 5, "shopifyLineItemId": "15454522671435"}, {"title": "Innato flute", "suffix": 6, "shopifyLineItemId": "15454522704203"}, {"title": "Innato flute", "suffix": 7, "shopifyLineItemId": "15454522736971"}, {"title": "Innato flute", "suffix": 8, "shopifyLineItemId": "15454522769739"}, {"title": "Innato flute", "suffix": 9, "shopifyLineItemId": "15573986246987"}, {"title": "Innato flute", "suffix": 10, "shopifyLineItemId": "15573986279755"}, {"title": "Innato flute", "suffix": 11, "shopifyLineItemId": "15577542984011"}, {"title": "Innato flute", "suffix": 12, "shopifyLineItemId": "15577543016779"}, {"title": "Innato flute", "suffix": 13, "shopifyLineItemId": "15577543049547"}]	2025-04-29 08:21:18.435	2025-04-29 09:20:16.826
133	138	[1, 2, 3, 4]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15996075311435"}, {"title": "Double flute", "suffix": 2, "shopifyLineItemId": "15996075344203"}, {"title": "Innato Cm4", "suffix": 3, "shopifyLineItemId": "16213365260619"}, {"title": "Double Medium Native Cm4", "suffix": 4, "shopifyLineItemId": "16213365293387"}]	2025-04-29 08:20:21.406	2025-04-29 09:35:20.173
311	178	[1]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15840291357003"}]	2025-04-29 09:15:03.532	2025-04-29 09:19:25.446
310	166	[1]	[{"title": "Natey flute", "suffix": 1, "shopifyLineItemId": "15889908793675"}]	2025-04-29 09:14:52.536	2025-04-29 09:19:14.633
166	172	[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15870284366155"}, {"title": "Innato flute", "suffix": 2, "shopifyLineItemId": "15870284398923"}, {"title": "Innato flute", "suffix": 3, "shopifyLineItemId": "15870284431691"}, {"title": "Innato flute", "suffix": 4, "shopifyLineItemId": "15870284464459"}, {"title": "Innato flute", "suffix": 5, "shopifyLineItemId": "15870284497227"}, {"title": "Innato flute", "suffix": 6, "shopifyLineItemId": "15870284529995"}, {"title": "Innato flute", "suffix": 7, "shopifyLineItemId": "15870284562763"}, {"title": "Innato flute", "suffix": 8, "shopifyLineItemId": "15870284595531"}, {"title": "Innato flute", "suffix": 9, "shopifyLineItemId": "15870284628299"}, {"title": "Innato flute", "suffix": 10, "shopifyLineItemId": "15870284661067"}, {"title": "Innato flute", "suffix": 11, "shopifyLineItemId": "15870284693835"}, {"title": "Innato flute", "suffix": 12, "shopifyLineItemId": "15870284726603"}]	2025-04-29 08:20:35.075	2025-04-29 09:19:17.396
312	252	[1, 2, 3, 4, 5, 6, 7, 8, 9]	[{"title": "Natey flute", "suffix": 1, "shopifyLineItemId": "14786752545099"}, {"title": "Natey flute", "suffix": 2, "shopifyLineItemId": "14786752577867"}, {"title": "Natey flute", "suffix": 3, "shopifyLineItemId": "14786752610635"}, {"title": "Natey flute", "suffix": 4, "shopifyLineItemId": "14786752643403"}, {"title": "Natey flute", "suffix": 5, "shopifyLineItemId": "14786752676171"}, {"title": "Innato flute", "suffix": 6, "shopifyLineItemId": "14786752708939"}, {"title": "Innato flute", "suffix": 7, "shopifyLineItemId": "14786752741707"}, {"title": "Innato flute", "suffix": 8, "shopifyLineItemId": "14786752774475"}, {"title": "Innato flute", "suffix": 9, "shopifyLineItemId": "14786752807243"}]	2025-04-29 09:15:42.257	2025-04-29 09:20:00.738
308	75	[1]	[{"title": "Double Large Native Am3", "suffix": 1, "shopifyLineItemId": "16260633428299"}]	2025-04-29 09:13:54.588	2025-04-29 12:33:34.293
309	78	[1]	[{"title": "Double Medium Native Bbm3", "suffix": 1, "shopifyLineItemId": "16251654799691"}]	2025-04-29 09:13:56.206	2025-04-29 12:33:34.777
306	19	[1]	[{"title": "Innato Em4", "suffix": 1, "shopifyLineItemId": "16503235281227"}]	2025-04-29 09:13:11.458	2025-04-29 19:11:14.774
307	22	[1]	[{"title": "Innato Dm4", "suffix": 1, "shopifyLineItemId": "16494657077579"}]	2025-04-29 09:13:13.033	2025-04-29 19:11:16.333
247	255	[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15534905360715"}, {"title": "Innato flute", "suffix": 2, "shopifyLineItemId": "15534905393483"}, {"title": "Innato flute", "suffix": 3, "shopifyLineItemId": "15534905426251"}, {"title": "Innato flute", "suffix": 4, "shopifyLineItemId": "15534905459019"}, {"title": "Innato flute", "suffix": 5, "shopifyLineItemId": "15534905491787"}, {"title": "Innato flute", "suffix": 6, "shopifyLineItemId": "15534905524555"}, {"title": "Innato flute", "suffix": 7, "shopifyLineItemId": "15534905557323"}, {"title": "Innato flute", "suffix": 8, "shopifyLineItemId": "15534905590091"}, {"title": "Innato flute", "suffix": 9, "shopifyLineItemId": "15534905622859"}, {"title": "Innato flute", "suffix": 10, "shopifyLineItemId": "15534905655627"}, {"title": "Innato flute", "suffix": 11, "shopifyLineItemId": "15534905688395"}, {"title": "Innato flute", "suffix": 12, "shopifyLineItemId": "15534905721163"}, {"title": "Innato flute", "suffix": 13, "shopifyLineItemId": "15534905753931"}, {"title": "Innato flute", "suffix": 14, "shopifyLineItemId": "15534905786699"}, {"title": "Innato flute", "suffix": 15, "shopifyLineItemId": "15534905819467"}, {"title": "Innato flute", "suffix": 16, "shopifyLineItemId": "15534905852235"}, {"title": "Natey flute", "suffix": 17, "shopifyLineItemId": "15534905885003"}, {"title": "Natey flute", "suffix": 18, "shopifyLineItemId": "15534905917771"}, {"title": "Natey flute", "suffix": 19, "shopifyLineItemId": "15534905950539"}, {"title": "Natey flute", "suffix": 20, "shopifyLineItemId": "15534905983307"}, {"title": "Natey flute", "suffix": 21, "shopifyLineItemId": "15534906016075"}, {"title": "Natey flute", "suffix": 22, "shopifyLineItemId": "15534906048843"}, {"title": "Natey flute", "suffix": 23, "shopifyLineItemId": "15534906081611"}, {"title": "Natey flute", "suffix": 24, "shopifyLineItemId": "15534906114379"}, {"title": "Natey flute", "suffix": 25, "shopifyLineItemId": "15534906147147"}, {"title": "Natey flute", "suffix": 26, "shopifyLineItemId": "15534906179915"}, {"title": "Natey flute", "suffix": 27, "shopifyLineItemId": "15534906212683"}, {"title": "Natey flute", "suffix": 28, "shopifyLineItemId": "15534906245451"}, {"title": "Natey flute", "suffix": 29, "shopifyLineItemId": "15534906278219"}, {"title": "Natey flute", "suffix": 30, "shopifyLineItemId": "15534906310987"}, {"title": "Natey flute", "suffix": 31, "shopifyLineItemId": "15534906343755"}, {"title": "Natey flute", "suffix": 32, "shopifyLineItemId": "15534906376523"}, {"title": "Natey flute", "suffix": 33, "shopifyLineItemId": "15534906409291"}, {"title": "Natey flute", "suffix": 34, "shopifyLineItemId": "15534906442059"}, {"title": "Natey flute", "suffix": 35, "shopifyLineItemId": "15534906474827"}, {"title": "Natey flute", "suffix": 36, "shopifyLineItemId": "15573968027979"}]	2025-04-29 08:21:08.612	2025-04-29 09:20:03.741
146	151	[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40]	[{"title": "Innato flute", "suffix": 1, "shopifyLineItemId": "15966436950347"}, {"title": "Innato flute", "suffix": 2, "shopifyLineItemId": "15966436983115"}, {"title": "Natey flute", "suffix": 3, "shopifyLineItemId": "15966437015883"}, {"title": "Natey flute", "suffix": 4, "shopifyLineItemId": "15966437048651"}, {"title": "Natey flute", "suffix": 5, "shopifyLineItemId": "15966437081419"}, {"title": "Natey flute", "suffix": 6, "shopifyLineItemId": "15966437114187"}, {"title": "Natey flute", "suffix": 7, "shopifyLineItemId": "15966437146955"}, {"title": "Natey flute", "suffix": 8, "shopifyLineItemId": "15966437179723"}, {"title": "Natey flute", "suffix": 9, "shopifyLineItemId": "15966437212491"}, {"title": "Natey flute", "suffix": 10, "shopifyLineItemId": "15966437245259"}, {"title": "Natey flute", "suffix": 11, "shopifyLineItemId": "15966437278027"}, {"title": "Natey flute", "suffix": 12, "shopifyLineItemId": "15966437310795"}, {"title": "Natey flute", "suffix": 13, "shopifyLineItemId": "15966437343563"}, {"title": "Natey flute", "suffix": 14, "shopifyLineItemId": "15966437376331"}, {"title": "Natey flute", "suffix": 15, "shopifyLineItemId": "15966437409099"}, {"title": "Natey flute", "suffix": 16, "shopifyLineItemId": "15966437441867"}, {"title": "Natey flute", "suffix": 17, "shopifyLineItemId": "15966437474635"}, {"title": "Natey flute", "suffix": 18, "shopifyLineItemId": "15966437507403"}, {"title": "Natey flute", "suffix": 19, "shopifyLineItemId": "15966437540171"}, {"title": "Natey flute", "suffix": 20, "shopifyLineItemId": "15966437572939"}, {"title": "Natey flute", "suffix": 21, "shopifyLineItemId": "15966437605707"}, {"title": "Natey flute", "suffix": 22, "shopifyLineItemId": "15966437638475"}, {"title": "Natey flute", "suffix": 23, "shopifyLineItemId": "15966437671243"}, {"title": "Natey Em3", "suffix": 24, "shopifyLineItemId": "16135832305995"}, {"title": "Natey Fm3", "suffix": 25, "shopifyLineItemId": "16135832338763"}, {"title": "Double Large Native Gm3", "suffix": 26, "shopifyLineItemId": "16135832371531"}, {"title": "Double Large Native Gm3", "suffix": 27, "shopifyLineItemId": "16135832404299"}, {"title": "Double Large Native Gm3", "suffix": 28, "shopifyLineItemId": "16135832437067"}, {"title": "Natey G#m3", "suffix": 29, "shopifyLineItemId": "16135832469835"}, {"title": "Natey F#m3", "suffix": 30, "shopifyLineItemId": "16135832502603"}, {"title": "Natey Bbm3", "suffix": 31, "shopifyLineItemId": "16135832535371"}, {"title": "Natey Bm3", "suffix": 32, "shopifyLineItemId": "16135832568139"}, {"title": "Natey Fm3", "suffix": 33, "shopifyLineItemId": "16135920648523"}, {"title": "Double Large Native Am3", "suffix": 34, "shopifyLineItemId": "16135920681291"}, {"title": "Natey Am4", "suffix": 35, "shopifyLineItemId": "16135920714059"}, {"title": "Natey Gm3", "suffix": 36, "shopifyLineItemId": "16135936377163"}, {"title": "Natey Gm3", "suffix": 37, "shopifyLineItemId": "16135936409931"}, {"title": "Natey Gm3", "suffix": 38, "shopifyLineItemId": "16135936442699"}, {"title": "Natey D#m4", "suffix": 39, "shopifyLineItemId": "16135945716043"}, {"title": "Innato Em3 (NEW)", "suffix": 40, "shopifyLineItemId": "16135952597323"}]	2025-04-29 08:20:26.396	2025-04-29 09:35:27.501
35	37	[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]	[{"title": "Innato Am3", "suffix": 1, "shopifyLineItemId": "16452648730955"}, {"title": "Innato Am3", "suffix": 2, "shopifyLineItemId": "16452648763723"}, {"title": "Innato Am3", "suffix": 3, "shopifyLineItemId": "16452648796491"}, {"title": "Innato Cm4", "suffix": 4, "shopifyLineItemId": "16452648829259"}, {"title": "Innato Cm4", "suffix": 5, "shopifyLineItemId": "16452648862027"}, {"title": "Innato Cm4", "suffix": 6, "shopifyLineItemId": "16452648894795"}, {"title": "Innato Cm4", "suffix": 7, "shopifyLineItemId": "16452648927563"}, {"title": "Innato Cm4", "suffix": 8, "shopifyLineItemId": "16452648960331"}, {"title": "Innato Em3 (NEW)", "suffix": 9, "shopifyLineItemId": "16452648993099"}, {"title": "Innato F#m3", "suffix": 10, "shopifyLineItemId": "16452649025867"}, {"title": "Innato Fm3", "suffix": 11, "shopifyLineItemId": "16452649058635"}, {"title": "Innato Gm3", "suffix": 12, "shopifyLineItemId": "16454488064331"}, {"title": "Innato F#m3", "suffix": 13, "shopifyLineItemId": "16589132824907"}, {"title": "Innato F#m3", "suffix": 14, "shopifyLineItemId": "16589132857675"}, {"title": "Natey Em4", "suffix": 15, "shopifyLineItemId": "16589132890443"}, {"title": "Innato F#m3", "suffix": 16, "shopifyLineItemId": "16452649025867"}]	2025-04-29 08:19:24.923	2025-04-29 19:11:23.692
48	50	[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66]	[{"title": "Innato Dm4", "suffix": 1, "shopifyLineItemId": "16370898239819"}, {"title": "Innato Dm4", "suffix": 2, "shopifyLineItemId": "16370898272587"}, {"title": "Innato Em4", "suffix": 3, "shopifyLineItemId": "16370898305355"}, {"title": "Innato Cm4", "suffix": 4, "shopifyLineItemId": "16370898338123"}, {"title": "Innato Cm4", "suffix": 5, "shopifyLineItemId": "16370898370891"}, {"title": "Innato Cm4", "suffix": 6, "shopifyLineItemId": "16370898403659"}, {"title": "Innato Bm3", "suffix": 7, "shopifyLineItemId": "16370898436427"}, {"title": "Innato Bm3", "suffix": 8, "shopifyLineItemId": "16370898469195"}, {"title": "Innato Am3", "suffix": 9, "shopifyLineItemId": "16370898501963"}, {"title": "Innato Am3", "suffix": 10, "shopifyLineItemId": "16370898534731"}, {"title": "Innato Gm3", "suffix": 11, "shopifyLineItemId": "16370898567499"}, {"title": "Innato Gm3", "suffix": 12, "shopifyLineItemId": "16370898600267"}, {"title": "Innato G#m3", "suffix": 13, "shopifyLineItemId": "16370898633035"}, {"title": "Natey Am3", "suffix": 14, "shopifyLineItemId": "16370898665803"}, {"title": "Natey Am3", "suffix": 15, "shopifyLineItemId": "16370898698571"}, {"title": "Natey Am3", "suffix": 16, "shopifyLineItemId": "16370898731339"}, {"title": "Natey Am3", "suffix": 17, "shopifyLineItemId": "16370898764107"}, {"title": "Natey Am3", "suffix": 18, "shopifyLineItemId": "16370898796875"}, {"title": "Natey Am3", "suffix": 19, "shopifyLineItemId": "16370898829643"}, {"title": "Natey Bm3", "suffix": 20, "shopifyLineItemId": "16370898862411"}, {"title": "Natey Bm3", "suffix": 21, "shopifyLineItemId": "16370898895179"}, {"title": "Natey Bm3", "suffix": 22, "shopifyLineItemId": "16370898927947"}, {"title": "Natey Cm4", "suffix": 23, "shopifyLineItemId": "16370898960715"}, {"title": "Natey Cm4", "suffix": 24, "shopifyLineItemId": "16370898993483"}, {"title": "Natey Cm4", "suffix": 25, "shopifyLineItemId": "16370899026251"}, {"title": "Natey Dm4", "suffix": 26, "shopifyLineItemId": "16370899059019"}, {"title": "Natey Dm4", "suffix": 27, "shopifyLineItemId": "16370899091787"}, {"title": "Natey Em3", "suffix": 28, "shopifyLineItemId": "16370899124555"}, {"title": "Natey Em3", "suffix": 29, "shopifyLineItemId": "16370899157323"}, {"title": "Natey F#m3", "suffix": 30, "shopifyLineItemId": "16370899190091"}, {"title": "Natey F#m4", "suffix": 31, "shopifyLineItemId": "16370899222859"}, {"title": "Natey F#m4", "suffix": 32, "shopifyLineItemId": "16370899255627"}, {"title": "Natey F#m4", "suffix": 33, "shopifyLineItemId": "16370899288395"}, {"title": "Natey Fm4", "suffix": 34, "shopifyLineItemId": "16370899321163"}, {"title": "Natey Fm4", "suffix": 35, "shopifyLineItemId": "16370899353931"}, {"title": "Natey Fm4", "suffix": 36, "shopifyLineItemId": "16370899386699"}, {"title": "Natey G#m3", "suffix": 37, "shopifyLineItemId": "16370899419467"}, {"title": "Natey G#m3", "suffix": 38, "shopifyLineItemId": "16370899452235"}, {"title": "Natey G#m3", "suffix": 39, "shopifyLineItemId": "16370899485003"}, {"title": "Natey G#m3", "suffix": 40, "shopifyLineItemId": "16370899517771"}, {"title": "Natey G#m3", "suffix": 41, "shopifyLineItemId": "16370899550539"}, {"title": "Natey Gm3", "suffix": 42, "shopifyLineItemId": "16370899583307"}, {"title": "Natey Gm3", "suffix": 43, "shopifyLineItemId": "16370899616075"}, {"title": "Natey Gm4", "suffix": 44, "shopifyLineItemId": "16370899648843"}, {"title": "Natey Gm4", "suffix": 45, "shopifyLineItemId": "16370899681611"}, {"title": "Natey Gm4", "suffix": 46, "shopifyLineItemId": "16370899714379"}, {"title": "Natey Gm4", "suffix": 47, "shopifyLineItemId": "16370899747147"}, {"title": "Innato Em4", "suffix": 48, "shopifyLineItemId": "16370917736779"}, {"title": "Natey Am4", "suffix": 49, "shopifyLineItemId": "16589992657227"}, {"title": "Natey Am4", "suffix": 50, "shopifyLineItemId": "16589992689995"}, {"title": "Innato Dm4", "suffix": 51, "shopifyLineItemId": "16370898239819"}, {"title": "Innato Dm4", "suffix": 52, "shopifyLineItemId": "16370898272587"}, {"title": "Innato Em4", "suffix": 53, "shopifyLineItemId": "16370898305355"}, {"title": "Innato Cm4", "suffix": 54, "shopifyLineItemId": "16370898338123"}, {"title": "Innato Cm4", "suffix": 55, "shopifyLineItemId": "16370898370891"}, {"title": "Innato Cm4", "suffix": 56, "shopifyLineItemId": "16370898403659"}, {"title": "Innato Cm4", "suffix": 57, "shopifyLineItemId": "16370898403659"}, {"title": "Innato Bm3", "suffix": 58, "shopifyLineItemId": "16370898436427"}, {"title": "Innato Bm3", "suffix": 59, "shopifyLineItemId": "16370898469195"}, {"title": "Innato Am3", "suffix": 60, "shopifyLineItemId": "16370898501963"}, {"title": "Innato Am3", "suffix": 61, "shopifyLineItemId": "16370898534731"}, {"title": "Innato Am3", "suffix": 62, "shopifyLineItemId": "16370898534731"}, {"title": "Innato Gm3", "suffix": 63, "shopifyLineItemId": "16370898567499"}, {"title": "Innato Gm3", "suffix": 64, "shopifyLineItemId": "16370898600267"}, {"title": "Innato Em4", "suffix": 65, "shopifyLineItemId": "16370917736779"}, {"title": "Natey Am4", "suffix": 66, "shopifyLineItemId": "16589992689995"}]	2025-04-29 08:19:34.797	2025-04-29 19:11:32.769
\.


--
-- TOC entry 3476 (class 0 OID 32769)
-- Dependencies: 217
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.users (id, username, password, current_challenge, device_id, remember_token, last_login) FROM stdin;
\.


--
-- TOC entry 3516 (class 0 OID 0)
-- Dependencies: 226
-- Name: instrument_inventory_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.instrument_inventory_id_seq', 1, false);


--
-- TOC entry 3517 (class 0 OID 0)
-- Dependencies: 228
-- Name: material_mapping_rules_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.material_mapping_rules_id_seq', 1, false);


--
-- TOC entry 3518 (class 0 OID 0)
-- Dependencies: 224
-- Name: materials_inventory_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.materials_inventory_id_seq', 1, false);


--
-- TOC entry 3519 (class 0 OID 0)
-- Dependencies: 230
-- Name: mold_inventory_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.mold_inventory_id_seq', 27, true);


--
-- TOC entry 3520 (class 0 OID 0)
-- Dependencies: 234
-- Name: mold_mapping_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.mold_mapping_items_id_seq', 50, true);


--
-- TOC entry 3521 (class 0 OID 0)
-- Dependencies: 232
-- Name: mold_mappings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.mold_mappings_id_seq', 40, true);


--
-- TOC entry 3522 (class 0 OID 0)
-- Dependencies: 220
-- Name: order_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.order_items_id_seq', 597, true);


--
-- TOC entry 3523 (class 0 OID 0)
-- Dependencies: 218
-- Name: orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.orders_id_seq', 317, true);


--
-- TOC entry 3524 (class 0 OID 0)
-- Dependencies: 222
-- Name: production_notes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.production_notes_id_seq', 1, false);


--
-- TOC entry 3525 (class 0 OID 0)
-- Dependencies: 236
-- Name: resellers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.resellers_id_seq', 12, true);


--
-- TOC entry 3526 (class 0 OID 0)
-- Dependencies: 238
-- Name: shopify_item_tracking_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.shopify_item_tracking_id_seq', 312, true);


--
-- TOC entry 3527 (class 0 OID 0)
-- Dependencies: 216
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.users_id_seq', 1, false);


--
-- TOC entry 3315 (class 2606 OID 32849)
-- Name: instrument_inventory instrument_inventory_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.instrument_inventory
    ADD CONSTRAINT instrument_inventory_pkey PRIMARY KEY (id);


--
-- TOC entry 3317 (class 2606 OID 32851)
-- Name: instrument_inventory instrument_inventory_serial_number_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.instrument_inventory
    ADD CONSTRAINT instrument_inventory_serial_number_key UNIQUE (serial_number);


--
-- TOC entry 3319 (class 2606 OID 32864)
-- Name: material_mapping_rules material_mapping_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.material_mapping_rules
    ADD CONSTRAINT material_mapping_rules_pkey PRIMARY KEY (id);


--
-- TOC entry 3313 (class 2606 OID 32837)
-- Name: materials_inventory materials_inventory_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.materials_inventory
    ADD CONSTRAINT materials_inventory_pkey PRIMARY KEY (id);


--
-- TOC entry 3321 (class 2606 OID 32877)
-- Name: mold_inventory mold_inventory_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.mold_inventory
    ADD CONSTRAINT mold_inventory_pkey PRIMARY KEY (id);


--
-- TOC entry 3325 (class 2606 OID 32898)
-- Name: mold_mapping_items mold_mapping_items_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.mold_mapping_items
    ADD CONSTRAINT mold_mapping_items_pkey PRIMARY KEY (id);


--
-- TOC entry 3323 (class 2606 OID 32889)
-- Name: mold_mappings mold_mappings_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.mold_mappings
    ADD CONSTRAINT mold_mappings_pkey PRIMARY KEY (id);


--
-- TOC entry 3307 (class 2606 OID 32811)
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- TOC entry 3309 (class 2606 OID 32813)
-- Name: order_items order_items_serial_number_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_serial_number_key UNIQUE (serial_number);


--
-- TOC entry 3303 (class 2606 OID 32797)
-- Name: orders orders_order_number_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_order_number_key UNIQUE (order_number);


--
-- TOC entry 3305 (class 2606 OID 32795)
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- TOC entry 3311 (class 2606 OID 32823)
-- Name: production_notes production_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.production_notes
    ADD CONSTRAINT production_notes_pkey PRIMARY KEY (id);


--
-- TOC entry 3327 (class 2606 OID 49163)
-- Name: resellers resellers_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.resellers
    ADD CONSTRAINT resellers_pkey PRIMARY KEY (id);


--
-- TOC entry 3297 (class 2606 OID 24582)
-- Name: session session_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (sid);


--
-- TOC entry 3329 (class 2606 OID 573515)
-- Name: shopify_item_tracking shopify_item_tracking_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.shopify_item_tracking
    ADD CONSTRAINT shopify_item_tracking_pkey PRIMARY KEY (id);


--
-- TOC entry 3299 (class 2606 OID 32776)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 3301 (class 2606 OID 32778)
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- TOC entry 3295 (class 1259 OID 24583)
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "IDX_session_expire" ON public.session USING btree (expire);


--
-- TOC entry 3330 (class 2606 OID 573516)
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


-- Completed on 2025-04-29 20:22:56 UTC

--
-- PostgreSQL database dump complete
--

