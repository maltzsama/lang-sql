<!-- NOTE: README.md is generated from src/README.md -->

# @maltzsama/lang-sql

[![CI](https://github.com/maltzsama/lang-sql/actions/workflows/ci.yml/badge.svg)](https://github.com/maltzsama/lang-sql/actions/workflows/ci.yml)

This is a fork of [`@codemirror/lang-sql`](https://code.haverbeke.berlin/codemirror/lang-sql)
by Marijn Haverbeke, extended with 30+ SQL dialects whose keyword data is
generated from [sqlingo](https://github.com/huydo862003/sqlingo), a JavaScript
port of [SQLGlot](https://github.com/tobymao/sqlglot).

[ [**WEBSITE**](https://codemirror.net/) | [**ISSUES**](https://github.com/maltzsama/lang-sql/issues) | [**FORUM**](https://discuss.codemirror.net/c/next/) | [**CHANGELOG**](https://github.com/maltzsama/lang-sql/blob/main/CHANGELOG.md) ]

This package implements SQL language support for the
[CodeMirror](https://codemirror.net/) code editor, with built-in
dialects for PostgreSQL, MySQL, SQLite, SQL Server, Oracle, BigQuery,
Snowflake, ClickHouse, DuckDB, Trino, Spark, and many others.

The [project page](https://codemirror.net/) has more information, a
number of [examples](https://codemirror.net/examples/) and the
[documentation](https://codemirror.net/docs/).

This code is released under an
[MIT license](https://code.haverbeke.berlin/codemirror/lang-sql/tree/main/LICENSE).

We aim to be an inclusive, welcoming community. To make that explicit,
we have a [code of
conduct](http://contributor-covenant.org/version/1/1/0/) that applies
to communication around the project.

## Usage

```javascript
import {EditorView, basicSetup} from "codemirror"
import {sql} from "@maltzsama/lang-sql"

const view = new EditorView({
  parent: document.body,
  doc: `select * from users where age > 20`,
  extensions: [basicSetup, sql()]
})
```

Use `sql({dialect: PostgreSQL})` or similar to select a specific SQL
dialect.

## Dialect data

The keyword, type, and builtin lists for the bundled dialects are
generated from [sqlingo](https://github.com/huydo862003/sqlingo), a
JavaScript port of SQLGlot. To change them, edit
`scripts/generate-dialects.mjs` and run `npm run generate-dialects`,
then commit the updated `src/dialects.ts`.

## API Reference

@sql

@SQLConfig

@SQLNamespace

@SQLDialect

@SQLDialectSpec

@StandardSQL
@PostgreSQL
@MySQL
@MariaSQL
@MSSQL
@SQLite
@Cassandra
@PLSQL
@Athena
@BigQuery
@ClickHouse
@Databricks
@Doris
@Dremio
@Drill
@Druid
@DuckDB
@Dune
@Exasol
@Fabric
@Hive
@Materialize
@Presto
@Redshift
@RisingWave
@SingleStore
@Snowflake
@Solr
@Spark
@Spark2
@StarRocks
@Tableau
@Teradata
@Trino
@Oracle
@TSQL

@keywordCompletionSource
@schemaCompletionSource
