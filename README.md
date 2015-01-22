# GitBook CLI

[![NPM version](https://badge.fury.io/js/gitbook-cli.svg)](http://badge.fury.io/js/gitbook-cli)

The GitBook CLI is only supported by version `>=2.0.0` of GitBook.

## How to install it?

```
$ npm install -g gitbook-cli
```

## How to use it?

#### Build and Serve

Build a book in the curent directory using:

```
$ gitbook build
```

Build a book in another directory:

```
$ gitbook build ./other_folder
```

Build and serve the book:

```
$ gitbook serve ./
```

#### Specify a specific version

By default, GitBook CLI will read the gitbook version to use from the book configuration, but you can force a specific version using `--gitbook` option:

```
$ gitbook build ./mybook --gitbook=2.0.1
```
