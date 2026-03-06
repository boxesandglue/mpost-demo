# wasm-demo

Interactive web demo for the [mpgo](https://github.com/boxesandglue/mpgo) library. Users can click points on a canvas to create smooth Bézier curves using the Hobby-Knuth algorithm, with real-time visualization and controls for direction, tension, and path properties.

**Live demo: <https://hobby.boxesandglue.dev>**

## Build

```bash
./build.sh
```

## Run

```bash
python3 -m http.server 8080
```

Then open <http://localhost:8080>.

## License

MIT – see [LICENSE](LICENSE).
