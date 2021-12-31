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

const isPrivateMode: boolean = process.env.PRIVATE_DEPLOYMENT == "true";

console.log(
  `Server is running in ${isPrivateMode ? "😎 private" : "🙂 public"} mode`
);

const typeDefs = gql`
  directive @private on OBJECT | FIELD_DEFINITION | ENUM
  directive @public on OBJECT | FIELD_DEFINITION | ENUM

  type Client @public {
    fullName: String
    secretField: String @private
  }

  enum SecretEnum @private {
    ONE
    TWO
    THREE
  }

  type SecretThing @private {
    shhh: String
  }

  type Query @public {
    clients: [Client]
    secretThings: [SecretThing] @private
  }
`;

const resolvers = {
  Query: {
    clients: () => [
      { fullName: "Merlin Counting Stars", secretField: "12345" },
      { fullName: "Rythem n Blues", secretField: "9876" },
    ],

    secretThings: () => [
      {
        shhh: "nothing to see here",
      },
    ],
  },
};

const transforms: Array<Transform> = [
  new FilterRootFields((_operationName, _fieldName, fieldConfig) => {
    const isFieldPrivate = getDirective(schema, fieldConfig, "private")?.[0];
    return isPrivateMode || !isFieldPrivate;
  }),

  new FilterObjectFields((_operationName, _fieldName, fieldConfig) => {
    const isFieldPrivate = getDirective(schema, fieldConfig, "private")?.[0];
    return isPrivateMode || !isFieldPrivate;
  }),

  new FilterTypes((graphQLNamedType) => {
    const isTypePrivate = getDirective(
      schema,
      graphQLNamedType,
      "private"
    )?.[0];

    return isPrivateMode || !isTypePrivate;
  }),
];

let schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

schema = wrapSchema({ schema, transforms });

const server = new ApolloServer({ schema });

server.listen().then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});
