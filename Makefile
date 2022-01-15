build: lint
	tsc

dev: start
	npx microbundle watch -o dist/ --sourcemap false --compress false

test:
	npx jest --coverage

lint:
	npx eslint --fix --ext .js,.jsx,.ts,.tsx ./

init:
	npx supabase init

start:
	npx supabase start

remove-dist:
	npx rimraf dist

next-small-version:
	npm version patch

publish: remove-dist build next-small-version
	npm publish