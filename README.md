# gitbook-cli [![NPM version](https://badge.fury.io/js/gitbook-cli.svg)](http://badge.fury.io/js/gitbook-cli)

> The GitBook command line interface.

Install this globally and you'll have access to the gitbook command anywhere on your system.

```
$ npm install -g gitbook-cli
```

**Note:** The job of the gitbook command is to load and run the version of GitBook you have specified in your book (or the latest one), irrespective of its version. The GitBook CLI only support versions `>=2.0.0` of GitBook.

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

#### Manage versions

List installed versions:

```
$ gitbook versions
```

Pre-install a specific version:

```
$ gitbook version:install 2.1.0
```

Uninstall a specific version

```
$ gitbook version:uninstall 2.0.1
```

Use a local folder as a GitBook version (for developement)

```
$ gitbook version:link 2.0.1-alpha ./mygitbook
```