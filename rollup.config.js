import babel from 'rollup-plugin-babel'
import builtins from 'rollup-plugin-node-builtins'
import commonJS from 'rollup-plugin-commonjs'
import fs from 'fs'
import globals from 'rollup-plugin-node-globals'
import minify from 'rollup-plugin-babel-minify'
import path from 'path'
import pkg from './package.json'
import replace from 'rollup-plugin-replace'
import resolve from 'rollup-plugin-node-resolve'

const PRODUCTION_BUILD = process.env.NODE_ENV === 'production'

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
      replace(getReplacements()),
      babel({
        presets: [
          [
            '@babel/preset-env',
            {
              modules: false,
              targets: {
                node: '10'
              }
            }
          ]
        ],
        plugins: getBabelPlugins()
      })
    ]
  },
  ...(PRODUCTION_BUILD ? [{
    input: path.resolve(__dirname, 'src', 'index.browser.js'),
    output: [
      {
        file: pkg.unpkg,
        format: 'iife',
        name: pkg.library,
        sourcemap: true
      }
    ],
    context: 'window',
    plugins: [
      replace(getReplacements()),
      globals(),
      builtins(),
      resolve({
        browser: true,
        preferBuiltins: true
      }),
      commonJS({
        namedExports: {
          '../../node_modules/loglevel/lib/loglevel.js': [
            'setLevel',
            'trace',
            'debug',
            'info',
            'warn',
            'error'
          ]
        }
      }),
      babel({
        exclude: ['../../node_modules/**', 'node_modules/**'],
        presets: [
          [
            '@babel/preset-env',
            {
              modules: false,
              targets: {
                browsers: ['> 2%']
              }
            }
          ]
        ],
        runtimeHelpers: true,
        plugins: getBabelPlugins({ includeTransformRuntime: true })
      }),
      minify({
        comments: false,
        banner: getBanner(),
        bannerNewLine: false, // Don't set bannerNewLine to true or it'll wipe out sourcemaps. See:
        sourceMap: true //       https://github.com/Comandeer/rollup-plugin-babel-minify/issues/133.
      })
    ]
  }] : [])
]

function isExternal (candidate) {
  return Object.keys(pkg.dependencies).some(dependency => {
    return candidate.startsWith(dependency)
  })
}

function getBanner () {
  const filePath = path.resolve(__dirname, 'src', 'banner.js')
  return fs.readFileSync(filePath).toString().trim()
}

function getBabelPlugins (options = {}) {
  const plugins = [
    '@babel/plugin-proposal-object-rest-spread'
  ]
  if (options.includeTransformRuntime) {
    plugins.push('@babel/plugin-transform-runtime')
  }
  return plugins
}

function getReplacements () {
  const replacements = {}
  for (const key in process.env) {
    replacements[`process.env.${key}`] = JSON.stringify(process.env[key])
  }
  return replacements
}
