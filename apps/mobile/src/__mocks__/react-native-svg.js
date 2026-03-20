/**
 * Mock for react-native-svg in Jest tests.
 */
const React = require('react')
const { View } = require('react-native')

const mock = (props) => React.createElement(View, null, props && props.children)
const mockNoChildren = () => React.createElement(View, null)

const Svg = mock
Svg.displayName = 'Svg'

const Circle = mockNoChildren
Circle.displayName = 'Circle'

const Path = mockNoChildren
Path.displayName = 'Path'

const G = mock
G.displayName = 'G'

const Rect = mockNoChildren
Rect.displayName = 'Rect'

const Line = mockNoChildren
Line.displayName = 'Line'

const SvgText = mock
SvgText.displayName = 'Text'

module.exports = Svg
module.exports.default = Svg
module.exports.Svg = Svg
module.exports.Circle = Circle
module.exports.Path = Path
module.exports.G = G
module.exports.Rect = Rect
module.exports.Line = Line
module.exports.Polyline = mockNoChildren
module.exports.Polygon = mockNoChildren
module.exports.Ellipse = mockNoChildren
module.exports.Text = SvgText
module.exports.TSpan = mock
module.exports.TextPath = mock
module.exports.Use = mock
module.exports.Image = mock
module.exports.Symbol = mock
module.exports.Defs = mock
module.exports.LinearGradient = mock
module.exports.RadialGradient = mock
module.exports.Stop = mockNoChildren
module.exports.ClipPath = mock
module.exports.Mask = mock
module.exports.Pattern = mock
module.exports.Marker = mock
module.exports.ForeignObject = mock
