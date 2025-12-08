import { ApolloClient, InMemoryCache, createHttpLink } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";

const httpLink = createHttpLink({
  uri: `${process.env.NEXT_PUBLIC_BACKEND_URL}/graphql`,
  credentials: "include",
});

const authLink = setContext((_, { headers }) => {
  let token =
    typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

  // Fallback: Try to get from cookie if not in localStorage
  if (!token && typeof document !== "undefined") {
    const match = document.cookie.match(new RegExp("(^| )auth_token=([^;]+)"));
    if (match) token = match[2];
  }

  console.log(
    "ApolloClient: authLink running. Token:",
    token ? "Found" : "Null"
  );

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    },
  };
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

export default client;
