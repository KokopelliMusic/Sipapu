build: lint && test
	microbundle -o dist/ --sourcemap false --compress false

dev: start
	microbundle watch -o dist/ --sourcemap false --compress false

test:
	jest --coverage

lint:
	eslint --fix --ext .js,.jsx,.ts,.tsx ./

init:
	npx supabase init

start:
	npx supabase start