## Github Action: keep-a-changelog-merge

If you [keep a changelog](https://keepachangelog.com/) with git flow you're going 
to run into merge conflicts in CHANGELOG.md between your feature branches 
and your development branch. `git merge` is no help but this package is.



### How to use Locally

`CHANGELOG.md.default` assumes this is a copy of the CHANGELOG that exists in the 
default branch repo, the CHANGELOG you want to merge into.

Node.js
```bash
npm install
node index.js --source ./CHANGELOG.md --destination ./CHANGELOG.md.default
```

Docker 

```bash
docker build -t keep-a-changelog-merge . 
docker run \
    -v $(pwd)/test:/test \
    keep-a-changelog-merge \
    --source /test/CHANGELOG.md \
    --destination /test/CHANGELOG.md.default
```

### How to use as a GitHub Action 

```yaml
name: Resolve Changelog.md conflicts

on:
  push:
    branches:
      - '**/**'
    paths:
      - 'CHANGELOG.md'

jobs:
  merge-changelog:
    name: "Resolve Changelog merge conflicts (if any)"
    runs-on: ubuntu:latest
    outputs:
      imageTag: ${{ steps.build.outputs.imageTag }}
    steps:
      - uses: actions/checkout@v2
        
      - name: Get a copy of the Remote branches Changelog
        run: |
          mv CHANGELOG.md CHANGELOG.md.tmp
          git checkout ${{ github.event.repository.default_branch }} -- CHANGELOG.md
          mv CHANGELOG.md CHANGELOG.md.remote
          mv CHANGELOG.tmp CHANGELOG.md
    
      - uses: pointivo/keep-a-changelog-merge

      - name: Initialize mandatory git config
        run: |
          git config user.name "GitHub actions"
          git config user.email noreply@github.com

      - name: Commit changelog if modified
        run: |
          if $(git ls-files --modified | grep CHANGELOG.md); then
            echo "Changelog modified"
            git add CHANGELOG.md
            git commit -m "Sync CHANGELOG with ${{ github.event.repository.default_branch }}. [skip ci]"
            git push origin release/${{ env.RELEASE_VERSION }}
          else 
            echo "Changelog not modified"
          fi

```