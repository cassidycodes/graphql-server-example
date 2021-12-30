import { ApolloServer, gql } from 'apollo-server';

const typeDefs = gql`
  type Client {
    fullName: String
    tin: String
  }

  type Query {
    clients: [Client]
  }
`;

const clients = [
  {
    fullName: 'Merlin Counting Stars',
    tin: '12345',
  },
  { fullName: 'Blue',
    tin: '9876',
  }
];

const resolvers = {
  Query: {
    clients: () => clients,
  },
};

const server = new ApolloServer({ typeDefs, resolvers  });

server.listen().then(({ url }) => {
  console.log(` Server ready at ${ url }`);
});
