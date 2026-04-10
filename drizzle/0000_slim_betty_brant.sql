CREATE TYPE "public"."origem" AS ENUM('xml', 'manual');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TABLE "nota_status" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" varchar(100) NOT NULL,
	"descricao" text,
	"cor" varchar(20) DEFAULT '#6b7280' NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"ordem" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nota_tipo" (
	"id" serial PRIMARY KEY NOT NULL,
	"codigo" varchar(20) NOT NULL,
	"nome" varchar(100) NOT NULL,
	"descricao" text,
	"ativo" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "nota_tipo_codigo_unique" UNIQUE("codigo")
);
--> statement-breakpoint
CREATE TABLE "notas" (
	"id" serial PRIMARY KEY NOT NULL,
	"chaveAcesso" varchar(60),
	"numero" varchar(20) NOT NULL,
	"serie" varchar(10) DEFAULT '1' NOT NULL,
	"tipoId" integer NOT NULL,
	"statusId" integer,
	"emitenteCnpj" varchar(18) NOT NULL,
	"emitenteNome" varchar(200) NOT NULL,
	"emitenteUf" varchar(2),
	"destinatarioCnpjCpf" varchar(18),
	"destinatarioNome" varchar(200),
	"valorTotal" numeric(15, 2) NOT NULL,
	"valorDesconto" numeric(15, 2) DEFAULT '0',
	"valorImpostos" numeric(15, 2) DEFAULT '0',
	"dataEmissao" timestamp NOT NULL,
	"dataEntradaSaida" timestamp,
	"origem" "origem" DEFAULT 'manual' NOT NULL,
	"xmlUrl" text,
	"xmlNomeArquivo" varchar(255),
	"dadosExtras" json,
	"observacoes" text,
	"createdBy" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "notas_chaveAcesso_unique" UNIQUE("chaveAcesso"),
	CONSTRAINT "unique_nota" UNIQUE("numero","serie","emitenteCnpj","tipoId")
);
--> statement-breakpoint
CREATE TABLE "user_permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"canViewNotas" boolean DEFAULT true NOT NULL,
	"canCreateNota" boolean DEFAULT false NOT NULL,
	"canEditNota" boolean DEFAULT false NOT NULL,
	"canDeleteNota" boolean DEFAULT false NOT NULL,
	"canImportXml" boolean DEFAULT false NOT NULL,
	"canManageStatus" boolean DEFAULT false NOT NULL,
	"canManageTipos" boolean DEFAULT false NOT NULL,
	"canManageUsers" boolean DEFAULT false NOT NULL,
	"canViewDashboard" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" "role" DEFAULT 'user' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
--> statement-breakpoint
ALTER TABLE "notas" ADD CONSTRAINT "notas_tipoId_nota_tipo_id_fk" FOREIGN KEY ("tipoId") REFERENCES "public"."nota_tipo"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notas" ADD CONSTRAINT "notas_statusId_nota_status_id_fk" FOREIGN KEY ("statusId") REFERENCES "public"."nota_status"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notas" ADD CONSTRAINT "notas_createdBy_users_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;