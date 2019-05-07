#!/bin/sh

# abort the script if there is a non-zero error
# commented out b/c often there is no changes and the commit fails
# set -e

remote=$(git config remote.origin.url)

mkdir artifacts-branch
cd artifacts-branch

# now lets setup a new repo so we can update the artifacts branch
git config --global user.email "$GH_EMAIL" > /dev/null 2>&1
git config --global user.name "$GH_NAME" > /dev/null 2>&1
git init
git remote add --fetch origin "$remote"

# switch into the the artifacts branch
if git rev-parse --verify origin/artifacts > /dev/null 2>&1
then
    git checkout artifacts
    # delete any old content as we are going to replace it
    # Note: this explodes if there aren't any, so moving it here for now
    git rm -rf .
else
    git checkout --orphan artifacts
fi

# copy over or recompile the new site
cp -a -R ~/repo/artifacts/*.json ./

# stage any changes and new files
git add -A

if ! git diff-index --quiet HEAD --; then
    # now commit, ignoring branch artifacts doesn't seem to work, so trying skip
    git commit -m "Deploy to artifacts [ci skip]"
    # and push, but send any output to /dev/null to hide anything sensitive
    git push --force --quiet origin artifacts
fi

# go back to where we started and remove the artifacts git repo we made and used
# for deployment
cd ../
rm -rf artifacts-branch

echo "Complete"
