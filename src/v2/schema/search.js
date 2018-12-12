/** *****************************************************************************
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2018. All Rights Reserved.
 *
 * Note to U.S. Government Users Restricted Rights:
 * Use, duplication or disclosure restricted by GSA ADP Schedule
 * Contract with IBM Corp.
 ****************************************************************************** */

export const typeDef = `
  input SearchFilter {
    property: String
    values: [String]
    # Deprecated, use "property" instead.
    filter: String
  }

  input SearchRelatedInput {
    kind: String!
    count: Int
  }

  type SearchRelatedResult {
    kind: String!
    count: Int
  }

  input SearchInput {
    keywords: [String]
    filters: [SearchFilter]
    relationship: [SearchRelatedInput]
  }

  type SearchResult {
    count: Int
    items: JSON
    related: [SearchRelatedResult]
  }
`;

export const resolver = {
  Query: {
    search: (parent, args, { searchModel }) => searchModel.multiSearch(args),
    searchComplete: (parent, { field, property }, { searchModel }) =>
      searchModel.searchComplete({ field, property }),
    searchSchema: (parent, args, { searchModel }) => searchModel.searchSchema(),
  },
  SearchResult: {
    count: (parent, args, { searchModel }) => searchModel.resolveSearchCount(args),
    items: (parent, args, { searchModel }) => searchModel.resolveSearch(args),
    related: (parent, args, { searchModel }) => searchModel.resolveRelated(args),
  },
};
