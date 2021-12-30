const { ApolloServer, gql } = require('apollo-server');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const { mapSchema, getDirective, MapperKind } = require('@graphql-tools/utils');
const { SchemaDirectiveVisitor } = require('@graphql-tools');
const { makeFilteredSchema } = require('graphql-introspection-filtering')
const { schemaDirectivesToFilters } = require('@graphql-introspection-filtering/tools')
const { defaultFieldResolver } = require('graphql');

// A schema is a collection of type definitions (hence "typeDefs")
// that together define the "shape" of queries that are executed against
// your data.
const typeDefs = gql`
  # Comments in GraphQL strings (such as this one) start with the hash (#) symbol.

  # This "Book" type defines the queryable fields for every book in our data source.
  type Book {
    title: String
    author: String
    upperAuthor: String @uppercase
    password: String @internal
  }

  type Secret @internal {
    name: String
  }

  # The "Query" type is special: it lists all of the available queries that
  # clients can execute, along with the return type for each. In this
  # case, the "books" query returns an array of zero or more Books (defined above).
  type Query {
    books(author: String): [Book]
  }

  # Definition
  directive @uppercase on FIELD_DEFINITION
  directive @internal on OBJECT | FIELD_DEFINITION | ENUM
`;

const books = [
  {
    title: 'The Awakening',
    author: 'Kate Chopin',
    upperAuthor: 'kate chopin',
    password: 'sekret'
  },
  {
    title: 'City of Glass',
    author: 'Paul Auster',
  },
];

const secrets = [
  { name: 'very secret'}
]

// Resolvers define the technique for fetching the types defined in the
// schema. This resolver retrieves books from the "books" array above.
const resolvers = {
  Query: {
    books(parent, args, context, info) {
      return books.filter(book => book.author == args.author)
    }
  }
};

// This function takes in a schema and adds upper-casing logic
// to every resolver for an object field that has a directive with
// the specified name (we're using `upper`)
function upperDirectiveTransformer(schema, directiveName) {
  return mapSchema(schema, {

    // Executes once for each object field in the schema
    [MapperKind.OBJECT_FIELD]: (fieldConfig) => {

      // Check whether this field has the specified directive
      const upperDirective = getDirective(schema, fieldConfig, directiveName)?.[0];

      if (upperDirective) {

        // Get this field's original resolver
        const { resolve = defaultFieldResolver } = fieldConfig;

        // Replace the original resolver with a function that *first* calls
        // the original resolver, then converts its result to upper case
        fieldConfig.resolve = async function (source, args, context, info) {
          const result = await resolve(source, args, context, info);
          if (typeof result === 'string') {
            return result.toUpperCase();
          }
          return result;
        }
        return fieldConfig;
      }
    }
  });
}

class InternalDirective extends SchemaDirectiveVisitor {
  visitObject (subject) {
    subject.isInternal = true
  }

  visitEnum (subject) {
    subject.isInternal = true
  }

  visitFieldDefinition (subject) {
    subject.isInternal = true
  }

  static visitTypeIntrospection (type) {
    return InternalDirective.isAccessible(type)
  }

  static visitFieldIntrospection (type) {
    return InternalDirective.isAccessible(type)
  }

  static visitDirectiveIntrospection ({ name }) {
    return name !== 'internal'
  }

  static isAccessible (thing) {
    return !thing.isInternal
  }

}

const schemaDirectives = {
  internal: InternalDirective,
}

// Create the base executable schema
let schema = makeExecutableSchema({
  typeDefs,
  resolvers,
  schemaDirectives,
});

const filters = schemaDirectivesToFilters(schemaDirectives)
const filteredSchema = makeFilteredSchema(schema, filters)

// Transform the schema by applying directive logic
schema = upperDirectiveTransformer(filteredSchema, 'uppercase');

// The ApolloServer constructor requires two parameters: your schema
// definition and your set of resolvers.
const server = new ApolloServer({ schema: filteredSchema });

// The `listen` method launches a web server.
server.listen().then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`);
});