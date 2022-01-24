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

const isPublicMode: boolean = process.env.PUBLIC_DEPLOYMENT == "true";

console.log(
  `Server is running in ${isPublicMode ? "🙂 public" : "😎 private"} mode`
);

const typeDefs = gql`
  directive @public on OBJECT | FIELD_DEFINITION | ENUM
  directive @private on OBJECT | FIELD_DEFINITION | ENUM

  type Client @public {
    fullName: String @public
    secretField: String
  }

  enum SecretEnum {
    ONE
    TWO
    THREE
  }

  type SecretThing {
    shhh: String @public
  }

  type Query @public {
    clients: [Client] @public
    secretThings: [SecretThing]
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
  new FilterObjectFields((_operationName, _fieldName, fieldConfig) => {
    const isFieldPublic = getDirective(schema, fieldConfig, "public")?.[0];
    console.log(isFieldPublic);
    return !!isFieldPublic;
    // return !isFieldPublic || isPublicMode;
  }),

  // new FilterTypes((graphQLNamedType) => {
  //   const isTypePublic = getDirective(schema, graphQLNamedType, "public")?.[0];
  //   return false;
  //   // return isPublicMode || !!isTypePublic;
  // }),

  // new FilterRootFields((_operationName, _fieldName, fieldConfig) => {
  //   const isFieldPublic = getDirective(schema, fieldConfig, "public")?.[0];
  //   return false;
  //   // return !isFieldPublic || isPublicMode;
  // }),
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
