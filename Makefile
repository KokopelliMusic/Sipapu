build: lint
	npx microbundle -o dist/ --sourcemap false --compress false

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

publish: remove-dist build
	npm publish