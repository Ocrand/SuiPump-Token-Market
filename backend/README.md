# API Config

- ## How to run

1.Get mod

```bash
go mod init
```

2.Run go in your vps

```bash
go run api.go &
```

3.Run walrus Publisher and Aggregator

```
walrus aggregator -b "127.0.0.1:31415" # run an aggregator to read blobs
walrus publisher -b "127.0.0.1:31416" # run a publisher to store blobs
```

