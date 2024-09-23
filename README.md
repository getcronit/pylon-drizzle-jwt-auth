1. Setup your database
2. Start the server `bun dev`
3. Open your browser and go to `http://localhost:3000/graphql`
4. Start querying your data

```graphql
query Users {
  users {
    id
    name
    roles
  }
}

mutation CreateUser {
  userCreate(
    data: {
      name: "Nico"
      email: "nico.schett@cronit.io"
      password: "password"
      roles: [admin]
    }
  ) {
    id
    name
    password
    createdAt
    updatedAt
  }
}

mutation login {
  userLogin(email: "nico.schett@cronit.io", password: "password") {
    token
    user {
      id
    }
  }
}

query me {
  me {
    id
  }
}
```
