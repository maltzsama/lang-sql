import ist from "ist"
import {EditorState} from "@codemirror/state"
import {CompletionContext, CompletionSource} from "@codemirror/autocomplete"
import {
  Athena, BigQuery, ClickHouse, Databricks, Doris, Dremio, Drill, Druid, DuckDB, Dune,
  Exasol, Fabric, Hive, Materialize, Presto, Redshift, RisingWave, SingleStore, Snowflake,
  Solr, Spark, Spark2, StarRocks, Tableau, Teradata, Trino, MySQL, TSQL, MSSQL, Oracle, PLSQL,
  SQLDialect, keywordCompletionSource
} from "@codemirror/lang-sql"

function keywordsOf(dialect: SQLDialect) {
  let state = EditorState.create({
    doc: "",
    extensions: [dialect, dialect.language.data.of({autocomplete: keywordCompletionSource(dialect)})]
  })
  let source = state.languageDataAt<CompletionSource>("autocomplete", 0)[0]
  let result = source(new CompletionContext(state, 0, true))
  return new Set(result ? result.options.map(o => o.label) : [])
}

// A keyword that is specific to each dialect's vocabulary.
const dialectKeywords: [SQLDialect, string, string][] = [
  [Athena, "Athena", "unload"],
  [BigQuery, "BigQuery", "current_datetime"],
  [ClickHouse, "ClickHouse", "prewhere"],
  [Databricks, "Databricks", "stream"],
  [Doris, "Doris", "l2_distance"],
  [Dremio, "Dremio", "date_part"],
  [Drill, "Drill", "repeated_count"],
  [Druid, "Druid", "qualify"],
  [DuckDB, "DuckDB", "pivot_wider"],
  [Dune, "Dune", "try_cast"],
  [Exasol, "Exasol", "systimestamp"],
  [Fabric, "Fabric", "datetime2"],
  [Hive, "Hive", "serdeproperties"],
  [Materialize, "Materialize", "merge"],
  [Presto, "Presto", "try_cast"],
  [Redshift, "Redshift", "hllsketch"],
  [RisingWave, "RisingWave", "sink"],
  [SingleStore, "SingleStore", "utc_date"],
  [Snowflake, "Snowflake", "integration"],
  [Solr, "Solr", "ilike"],
  [Spark, "Spark", "lateral"],
  [Spark2, "Spark2", "lateral"],
  [StarRocks, "StarRocks", "largeint"],
  [Tableau, "Tableau", "countd"],
  [Teradata, "Teradata", "hashmd5"],
  [Trino, "Trino", "refresh"],
]

describe("Dialect keyword completion", () => {
  for (let [dialect, name, keyword] of dialectKeywords) {
    it(`completes ${name} keywords`, () => {
      ist(keywordsOf(dialect).has(keyword))
    })
  }
})

describe("Dialect tokenization", () => {
  function parse(dialect: SQLDialect, sql: string) {
    return dialect.language.parser.parse(sql).toString()
  }

  it("parses BigQuery backtick identifiers and hash comments", () => {
    ist(parse(BigQuery, "SELECT `tbl`"), "Script(Statement(Keyword,QuotedIdentifier))")
    ist(parse(BigQuery, "SELECT 1 # c\n"), "Script(Statement(Keyword,Number),LineComment)")
    ist(parse(BigQuery, "SELECT \"str\""), "Script(Statement(Keyword,String))")
  })

  it("parses ClickHouse backtick identifiers and hash comments", () => {
    ist(parse(ClickHouse, "SELECT `tbl`"), "Script(Statement(Keyword,QuotedIdentifier))")
    ist(parse(ClickHouse, "SELECT 1 # c\n"), "Script(Statement(Keyword,Number),LineComment)")
  })

  it("parses Snowflake slash comments", () => {
    ist(parse(Snowflake, "SELECT 1 // c\n"), "Script(Statement(Keyword,Number),LineComment)")
  })

  it("parses DuckDB dollar-quoted strings", () => {
    ist(parse(DuckDB, "SELECT $$hi$$"), "Script(Statement(Keyword,String))")
  })

  it("parses bracket-quoted identifiers", () => {
    ist(parse(Tableau, "SELECT [tbl]"), "Script(Statement(Keyword,QuotedIdentifier))")
    ist(parse(Exasol, "SELECT [tbl]"), "Script(Statement(Keyword,QuotedIdentifier))")
  })

  it("parses backtick identifiers in Spark", () => {
    ist(parse(Spark, "SELECT `tbl`"), "Script(Statement(Keyword,QuotedIdentifier))")
  })

  it("parses special variables", () => {
    ist(parse(MySQL, "SELECT @v"), "Script(Statement(Keyword,SpecialVar))")
    ist(parse(TSQL, "SELECT @@version"), "Script(Statement(Keyword,SpecialVar))")
  })
})

describe("Dialect aliases", () => {
  it("exposes Oracle and TSQL aliases", () => {
    ist(Oracle === PLSQL)
    ist(TSQL === MSSQL)
  })
})
