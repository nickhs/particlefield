clean:
	@rm -rf build

compress:
	@mkdir -p build
	@cp ./js/particlefield.js ./build/particlefield.js
	@./node_modules/.bin/uglifyjs -o ./build/particlefield.min.js ./js/particlefield.js
	@gzip -c ./build/particlefield.min.js > ./build/particlefield.min.js.gz

build: clean compress
