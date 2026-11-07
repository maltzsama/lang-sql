// Generates `src/dialects.ts` from the sqlingo package.
//
// sqlingo is a JavaScript port of SQLGlot. For every dialect it exposes the
// tokenizer keyword table and the parser function registry, which is exactly
// the data lang-sql needs for highlighting and keyword completion.
//
// Run with `npm run generate-dialects`.

import {readFileSync, writeFileSync} from "node:fs"
import {fileURLToPath} from "node:url"
import {dirname, join} from "node:path"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")

// sqlingo dialect name -> exported lang-sql name. PRQL is intentionally
// missing: it is a relational pipeline language, not SQL, so the SQL grammar
// in this package cannot meaningfully parse it.
const DIALECTS = [
  ["athena", "Athena"],
  ["bigquery", "BigQuery"],
  ["clickhouse", "ClickHouse"],
  ["databricks", "Databricks"],
  ["doris", "Doris"],
  ["dremio", "Dremio"],
  ["drill", "Drill"],
  ["druid", "Druid"],
  ["duckdb", "DuckDB"],
  ["dune", "Dune"],
  ["exasol", "Exasol"],
  ["fabric", "Fabric"],
  ["hive", "Hive"],
  ["materialize", "Materialize"],
  ["mysql", "MySQL"],
  ["oracle", "Oracle"],
  ["postgres", "Postgres"],
  ["presto", "Presto"],
  ["redshift", "Redshift"],
  ["risingwave", "RisingWave"],
  ["singlestore", "SingleStore"],
  ["snowflake", "Snowflake"],
  ["solr", "Solr"],
  ["spark", "Spark"],
  ["spark2", "Spark2"],
  ["sqlite", "SQLite"],
  ["starrocks", "StarRocks"],
  ["tableau", "Tableau"],
  ["teradata", "Teradata"],
  ["trino", "Trino"],
  ["tsql", "TSQL"],
]

// Function names that are parser plumbing rather than callable SQL functions.
const FUNCTION_BLACKLIST = new Set(["safe_func"])

// Words handled specially by lang-sql's tokenizer, never emitted as
// keywords/types.
const RESERVED = new Set(["true", "false", "null", "unknown"])

// Tokenizer flags that cannot be derived mechanically from sqlingo's data.
const OVERRIDES = {
  // MySQL treats `--` as a comment only when followed by whitespace.
  doris: {spaceAfterDashes: true},
  mysql: {spaceAfterDashes: true},
  singlestore: {spaceAfterDashes: true},
  starrocks: {spaceAfterDashes: true},
}

// Characters that may start a variable-like token (bind parameters, session
// variables). sqlingo's SINGLE_TOKENS lists `@` as a parameter for every
// dialect, but in many of them `@` is an operator, so this is curated.
const SPECIAL_VAR = {
  bigquery: "?@",
  doris: "@?",
  duckdb: "?$",
  fabric: "@",
  materialize: "?$",
  mysql: "@?",
  redshift: "?$",
  risingwave: "?$",
  singlestore: "@?",
  snowflake: "?$",
  sqlite: "@:?$",
  starrocks: "@?",
  tsql: "@",
  oracle: "?",
  postgres: "",
}

function specialVarFor(name) {
  if (name in SPECIAL_VAR) return SPECIAL_VAR[name]
  return "?"
}

function isIdent(name) {
  return /^[a-z_][a-z0-9_]*$/.test(name)
}

async function loadDialect(name) {
  let mod = await import(`sqlingo/${name}`)
  let cls = Object.values(mod).find(value => typeof value == "function" && value.DIALECT_NAME == name)
  if (!cls) throw new Error(`Cannot find dialect class for ${name}`)
  return cls
}

function typeTokens(parser) {
  let set = new Set()
  for (let prop of ["TYPE_TOKENS", "STRUCT_TYPE_TOKENS", "NESTED_TYPE_TOKENS", "ENUM_TYPE_TOKENS", "AGGREGATE_TYPE_TOKENS"])
    for (let tok of parser?.[prop] ?? []) set.add(tok)
  return set
}

function openQuote(pair) {
  let open = typeof pair == "string" ? pair : pair[0]
  return open.length == 1 ? open : null
}

function flagsFor(cls) {
  let tok = cls.tokenizerClass
  let identifiers = (tok.IDENTIFIERS ?? []).map(openQuote).filter(Boolean)
  let quotes = tok.QUOTES ?? []
  let comments = tok.COMMENTS ?? []
  let strategy = cls.NORMALIZATION_STRATEGY

  return {
    identifierQuotes: identifiers.join("") || undefined,
    doubleQuotedStrings: quotes.some(q => openQuote(q) == '"') || undefined,
    hashComments: comments.some(c => c == "#") || undefined,
    slashComments: comments.some(c => c == "//") || undefined,
    backslashEscapes: (tok.STRING_ESCAPES ?? []).includes("\\") || undefined,
    doubleDollarQuotedStrings: (tok.HEREDOC_STRINGS ?? []).some(q => openQuote(q) == "$") || undefined,
    unquotedBitLiterals: (tok.BIT_STRINGS ?? []).some(q => q == "0b") || undefined,
    specialVar: specialVarFor(cls.DIALECT_NAME),
    caseInsensitiveIdentifiers:
      (strategy == "caseInsensitive" || strategy == "caseInsensitiveUppercase") || undefined,
    ...(OVERRIDES[cls.DIALECT_NAME] ?? {}),
  }
}

function collect(cls, stdKeywords, stdTypes) {
  let parser = cls.parserClass
  let typeSet = typeTokens(parser)
  let keywordWords = new Set(), typeWords = new Set()

  for (let [word, token] of Object.entries(cls.tokenizerClass.KEYWORDS ?? {})) {
    let w = word.toLowerCase()
    if (!isIdent(w) || RESERVED.has(w)) continue
    if (typeSet.has(token)) typeWords.add(w)
    else keywordWords.add(w)
  }

  let functions = new Set()
  for (let name of Object.keys(parser?.FUNCTIONS ?? {})) {
    let w = name.toLowerCase()
    if (isIdent(w) && !FUNCTION_BLACKLIST.has(w)) functions.add(w)
  }

  return {
    keywords: new Set([...keywordWords].filter(w => !stdKeywords.has(w) && !stdTypes.has(w))),
    types: new Set([...typeWords].filter(w => !stdTypes.has(w) && !stdKeywords.has(w))),
    functions,
    flags: flagsFor(cls),
  }
}

function intersect(sets) {
  let out = new Set(sets[0])
  for (let set of sets.slice(1)) out = new Set([...out].filter(x => set.has(x)))
  return out
}

function formatWords(set, indent = "  ") {
  let words = [...set].sort()
  let lines = [], line = ""
  for (let word of words) {
    if (line.length + word.length + 1 > 100) { lines.push(line); line = "" }
    line += word + " "
  }
  if (line) lines.push(line)
  return lines.map((l, i) => indent + JSON.stringify(l.trimEnd() + " ") +
    (i < lines.length - 1 ? " +" : "")).join("\n")
}

function formatSpec(data, baseFunctions) {
  let builtin = [...data.functions].filter(w => !baseFunctions.has(w) && !data.keywords.has(w) && !data.types.has(w))

  let props = [
    `keywords: SQLKeywords + " " +\n${formatWords(data.keywords, "    ")}`,
    `types: SQLTypes + " " +\n${formatWords(data.types, "    ")}`,
    builtin.length ? `builtin: SQLFunctions + " " +\n${formatWords(new Set(builtin), "    ")}` : "builtin: SQLFunctions",
  ]
  for (let [key, value] of Object.entries(data.flags)) {
    if (value === undefined) continue
    props.push(`${key}: ${JSON.stringify(value)}`)
  }
  return props.map(prop => "  " + prop).join(",\n")
}

function readSourceConstants() {
  let src = readFileSync(join(root, "src/tokens.ts"), "utf8")
  return {
    keywords: src.match(/export const SQLKeywords = "([^"]*)"/)[1].split(" ").filter(Boolean),
    types: src.match(/export const SQLTypes = "([^"]*)"/)[1].split(" ").filter(Boolean),
  }
}

let {keywords: SQLKeywords, types: SQLTypes} = readSourceConstants()
let stdKeywords = new Set(SQLKeywords), stdTypes = new Set(SQLTypes)

let collected = []
for (let [name, exported] of DIALECTS) {
  let cls = await loadDialect(name)
  collected.push({name, exported, data: collect(cls, stdKeywords, stdTypes)})
}

// Any word that lang-sql treats as a keyword or type must not be emitted as a
// builtin, since builtins override both in the tokenizer word table.
let keywordOrType = new Set([...stdKeywords, ...stdTypes])
for (let {data} of collected) {
  for (let w of data.keywords) keywordOrType.add(w)
  for (let w of data.types) keywordOrType.add(w)
}
for (let {data} of collected)
  for (let w of keywordOrType) data.functions.delete(w)

let baseFunctions = intersect(collected.map(({data}) => data.functions))
let version = JSON.parse(readFileSync(join(root, "node_modules/sqlingo/package.json"), "utf8")).version

let header = `// Generated by scripts/generate-dialects.mjs from sqlingo@${version}.
// Do not edit by hand. Re-run \`npm run generate-dialects\` instead.

import {SQLKeywords, SQLTypes} from "./tokens"
import type {SQLDialectSpec} from "./sql"

// Functions supported by every dialect. Per-dialect lists only carry the
// functions that are not in this shared set.
const SQLFunctions =
${formatWords(baseFunctions)}
`

let body = []
for (let {name, exported, data} of collected) {
  let specName = name + "Spec"
  body.push(`/// Configuration for the ${exported} dialect.\nexport const ${specName}: SQLDialectSpec = {\n${formatSpec(data, baseFunctions)}\n}`)
}

writeFileSync(join(root, "src/dialects.ts"), header + "\n" + body.join("\n\n") + "\n")
console.log(`Generated src/dialects.ts with ${collected.length} dialect specs`)
