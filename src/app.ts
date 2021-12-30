import { ApolloServer, gql } from "apollo-server";
import {
  mapSchema,
  getDirective,
  MapperKind,
  pruneSchema,
} from "@graphql-tools/utils";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { Transform } from "@graphql-tools/delegate";
import {
  wrapSchema,
  FilterRootFields,
  FilterObjectFields,
  FilterTypes,
  FilterInterfaceFields,
} from "@graphql-tools/wrap";

const typeDefs = gql`
  directive @internal on OBJECT | FIELD_DEFINITION

  type Client {
    fullName: String
    secretField: String @internal
  }

  type SecretThing @internal {
    shhh: String
  }

  type Query {
    clients: [Client]
    secretThings: [SecretThing] @internal
  }
`;

const clients: Array<Object> = [
  { fullName: "Merlin Counting Stars", tin: "12345" },
  { fullName: "Rythem n Blues", tin: "9876" },
];

const secrets = [
  {
    shhh: "nothing to see here",
  },
];

const resolvers = {
  Query: {
    clients: () => clients,
    secretThings: () => secrets,
  },
};

const isPublic: boolean = true;

const transforms: Array<Transform> = [
  new FilterRootFields((_operationName, _fieldName, fieldConfig) => {
    const isInternal = getDirective(schema, fieldConfig, "internal")?.[0];
    if (isPublic) {
      return !isInternal;
    } else {
      return true;
    }
  }),

  new FilterObjectFields((_operationName, _fieldName, fieldConfig) => {
    const isInternal = getDirective(schema, fieldConfig, "internal")?.[0];
    if (isPublic) {
      return !isInternal;
    } else {
      return true;
    }
  }),

  new FilterTypes((graphQLNamedType) => {
    const isInternal = getDirective(schema, graphQLNamedType, "internal")?.[0];
    if (isPublic) {
      return !isInternal;
    } else {
      return true;
    }
  }),
];

let schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

schema = wrapSchema({ schema, transforms });

const server = new ApolloServer({ schema });

server.listen().then(({ url }) => {
  console.log(`😎 Server ready at ${url}`);
});
