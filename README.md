# Normalize GraphQL Query

### Usage

TBD

### Why you need it

Consider you have a GraphQL API like this.

But sometimes you will get some queries like this.

```graphql
query ($_1kjtl64174kta: ID!) {
  generationModelVersionquery_14tc0yqlfqwfc: generationModelVersion(id: $_1kjtl64174kta) {
    __typename
    idgenerationModelVersion_42c46wm2gnbc: id
    modelIdgenerationModelVersion_42c46wm2gnbc: modelId
    modelgenerationModelVersion_42c46wm2gnbc: model {
      __typename
      extragenerationModel_42c46wm2gnbc: extra
      idgenerationModel_42c46wm2gnbc: id
      idgenerationModel_42c46wm2gnbc: id
      authorgenerationModel_42c46wm2gnbc: author {
        __typename
        profilesuser_42c46wm2gnbc: profiles
        iduser_42c46wm2gnbc: id
        usernameuser_42c46wm2gnbc: username
        displayNameuser_42c46wm2gnbc: displayName
        avatarMediauser_42c46wm2gnbc: avatarMedia {
          __typename
          idmedia_42c46wm2gnbc: id
          typemedia_42c46wm2gnbc: type
          widthmedia_42c46wm2gnbc: width
          heightmedia_42c46wm2gnbc: height
          imageTypemedia_42c46wm2gnbc: imageType
          urlsmedia_42c46wm2gnbc: urls {
            __typename
            variantimageUrl_42c46wm2gnbc: variant
            urlimageUrl_42c46wm2gnbc: url
          }
        }
      }
      # ...

```

![WTF](https://media0.giphy.com/media/4cQSQYz0a9x9S/giphy.gif?cid=ecf05e47f8skucucfp3ytg9b1v8qf0qg3g5k0yffxc3d0u4j&ep=v1_gifs_search&rid=giphy.gif&ct=g)

After you normalize it, you will get a query like this.

```graphql
query task($id: ID!) {
  task(id: $id) {
    __typename
    outputs
    parameters
    id
    priority
    artworkId
    media {
      __typename
      id
      type
      width
      height
      imageType
      urls {
        __typename
        variant
        url
        # ...
```

![clap](https://media3.giphy.com/media/1236TCtX5dsGEo/giphy.gif?cid=ecf05e4704julcaak3xc1mwxtj7tinh7ppewjk1xezyx4k4p&ep=v1_gifs_search&rid=giphy.gif&ct=g)

You will get the same query if their structure is the same.
