import babel from 'rollup-plugin-babel'
import path from 'path'
import pkg from './package.json'

function isExternal (candidate) {
  return Object.keys(pkg.dependencies).some(dependency => {
    return candidate.startsWith(dependency)
  })
}

export default [
  {
    input: path.resolve(__dirname, 'src', 'index.js'),
    external: isExternal,
    output: [
      {
        file: pkg.main,
        format: 'cjs',
        sourcemap: true
      },
      {
        file: pkg.module,
        format: 'es',
        sourcemap: true
      }
    ],
    plugins: [
      babel({
        runtimeHelpers: true,
        exclude: ['node_modules/**'],
        presets: [
          [
            '@babel/preset-env',
            {
              modules: false,
              targets: {
                node: 'current'
              }
            }
          ]
        ],
        plugins: [
          '@babel/plugin-transform-runtime'
        ]
      })
    ]
  }
]
