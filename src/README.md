<!-- NOTE: README.md is generated from src/README.md -->

# @codemirror/lang-sql [![NPM version](https://img.shields.io/npm/v/@codemirror/lang-sql.svg)](https://www.npmjs.org/package/@codemirror/lang-sql)

[ [**WEBSITE**](https://codemirror.net/) | [**ISSUES**](https://code.haverbeke.berlin/codemirror/dev/issues) | [**FORUM**](https://discuss.codemirror.net/c/next/) | [**CHANGELOG**](https://code.haverbeke.berlin/codemirror/lang-sql/src/branch/main/CHANGELOG.md) ]

This package implements SQL language support for the
[CodeMirror](https://codemirror.net/) code editor.

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
import {sql} from "@codemirror/lang-sql"

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
