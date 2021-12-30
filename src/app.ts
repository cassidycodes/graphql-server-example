import { ApolloServer, gql } from 'apollo-server';
import { mapSchema, getDirective, MapperKind, pruneSchema } from '@graphql-tools/utils'
import { makeExecutableSchema } from '@graphql-tools/schema';
import { Transform } from '@graphql-tools/delegate';
import {
  wrapSchema,
  FilterRootFields,
  FilterObjectFields,
  FilterTypes,
  FilterInterfaceFields
} from '@graphql-tools/wrap';

const typeDefs = gql`
  directive @internal on SCHEMA | SCALAR | OBJECT | FIELD_DEFINITION | ARGUMENT_DEFINITION | INTERFACE | UNION | ENUM | ENUM_VALUE | INPUT_OBJECT | INPUT_FIELD_DEFINITION

  type Client {
    fullName: String
    tin: String @internal
  }

  type Secret @internal {
    shhh: String
  }

  type Query {
    clients: [Client]
    secrets: [Secret] @internal
  }
`;

const clients: Array<Object>= [
  {
    fullName: 'Merlin Counting Stars',
    tin: '12345',
  },
  { fullName: 'Blue',
    tin: '9876',
  }
];

const secrets = [
  {
    shhh: "nothing to see here"
  }
]

const resolvers = {
  Query: {
    clients: () => clients,
    secrets: () => secrets,
  },
};



const transforms: Array<Transform> = [
  new FilterObjectFields((_operationName, _fieldName, fieldConfig) => {
    const directiveName = getDirective(schema, fieldConfig, 'internal')?.[0];
    return !directiveName
  }),

  new FilterRootFields((_operationName, _fieldName, fieldConfig) => {
    const directiveName = getDirective(schema, fieldConfig, 'internal')?.[0];
    return !directiveName
  })

];

let schema = makeExecutableSchema({
  typeDefs,
  resolvers,
})

schema = wrapSchema({ schema, transforms })

const server = new ApolloServer({ schema });

server.listen().then(({ url }) => {
  console.log(` Server ready at ${ url }`);
});
