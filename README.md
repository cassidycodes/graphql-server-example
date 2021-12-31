# GraphqQL Sample App with @private Directive

## Installation

```
yarn install
```
## Public Mode

Run in public mode:

```
PRIVATE_DEPLOYMENT=false yarn serve
```

**NOTE**: `PRIVATE_DEPLOYMENT` is an optional argument. If it is not included, `@private` objects and fields will be excluded.

### Example Public Schema

```gql
directive @private on OBJECT | FIELD_DEFINITION | ENUM

directive @public on OBJECT | FIELD_DEFINITION | ENUM

type Client {
  fullName: String
}

type Query {
  clients: [Client]
}
```

## Private Mode

Run in internal mode:
```
PRIVATE_DEPLOYMENT=true yarn serve
```

### Example Private Schema

```gql
directive @private on OBJECT | FIELD_DEFINITION | ENUM

directive @public on OBJECT | FIELD_DEFINITION | ENUM

type Client {
  fullName: String
  secretField: String
}

enum SecretEnum {
  ONE
  TWO
  THREE
}

type SecretThing {
  shhh: String
}

type Query {
  clients: [Client]
  secretThings: [SecretThing]
}
```
