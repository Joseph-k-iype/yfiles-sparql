import { INode, IRenderContext, NodeStyleBase, Visual, WebGLVisual } from 'yfiles'

export default class IsometricWebGLNodeStyle extends NodeStyleBase {
  createVisual(context: IRenderContext, node: INode): Visual {
    return new IsometricWebGLNodeStyleVisual(node)
  }

  updateVisual(context: IRenderContext, oldVisual: Visual, node: INode): Visual {
    return oldVisual
  }
}

type VertexTuple = [number, number, number]
interface ColorLike {
  r: number
  g: number
  b: number
  a: number
}

/**
 * A {@link WebGLVisual} that renders a node as a 3D cuboid.
 */
class IsometricWebGLNodeStyleVisual extends WebGLVisual {
  private readonly node: INode
  private buffer!: WebGLBuffer
  private vertexBuffer!: Float32Array

  constructor(node: INode) {
    super()
    this.node = node
  }

  render(ctx: IRenderContext, gl: WebGLRenderingContext): void {
    // a vertex consists of 7 float values, 3 for position (x, y, z) and 4 for the color (r, g, b, a)
    const vertexSize = 7
    // we render 6 faces, each face needs 2 triangles -> 6 * 2 * 3
    const numVertices = 36

    // very simple shaders that simply render the vertices at their positions with their corresponding colors
    const program = ctx.webGLSupport.useProgram(
      `attribute vec4 a_position;
            attribute vec4 a_color;
            varying vec4 v_color;

            void main() {
              gl_Position = u_yf_worldToWebGL_3d * a_position;
              v_color = a_color;
            }`,
      `precision mediump float;
            varying vec4 v_color;

            void main() {
              gl_FragColor = v_color;
            }`
    )

    if (!this.buffer || !gl.isBuffer(this.buffer)) {
      // initialize buffers
      this.buffer = gl.createBuffer()!
      this.vertexBuffer = new Float32Array(vertexSize * numVertices)
    }

    const rect = this.node.layout
    const { color, height, bottom } = (this.node.tag || {
      height: 0,
      color: { r: 1, g: 0, b: 0, a: 1 },
      bottom: 0
    }) as { color: ColorLike; height: number; bottom: number }

    let i = 0
    // helper function that populates the buffer with a vertex
    const vertexToBuffer = ([x, y, z]: VertexTuple, { r, g, b, a }: ColorLike): void => {
      this.vertexBuffer[i++] = x
      this.vertexBuffer[i++] = y
      this.vertexBuffer[i++] = z
      this.vertexBuffer[i++] = r
      this.vertexBuffer[i++] = g
      this.vertexBuffer[i++] = b
      this.vertexBuffer[i++] = a
    }

    // the base height of the node
    const bottomHeight = -bottom || 0
    // the four vertices of the back face
    const back = {
      bottomLeft: [rect.x, rect.y, bottomHeight],
      bottomRight: [rect.x + rect.width, rect.y, bottomHeight],
      topLeft: [rect.x, rect.y + rect.height, bottomHeight],
      topRight: [rect.x + rect.width, rect.y + rect.height, bottomHeight]
    } as Record<string, VertexTuple>
    // the four vertices of the front face
    const front = {
      bottomLeft: [rect.x, rect.y, bottomHeight - height],
      bottomRight: [rect.x + rect.width, rect.y, bottomHeight - height],
      topLeft: [rect.x, rect.y + rect.height, bottomHeight - height],
      topRight: [rect.x + rect.width, rect.y + rect.height, bottomHeight - height]
    } as Record<string, VertexTuple>

    // back face
    let currentColor = color
    vertexToBuffer(back.bottomLeft, currentColor)
    vertexToBuffer(back.topRight, currentColor)
    vertexToBuffer(back.topLeft, currentColor)
    vertexToBuffer(back.bottomLeft, currentColor)
    vertexToBuffer(back.bottomRight, currentColor)
    vertexToBuffer(back.topRight, currentColor)

    // front face
    currentColor = color
    vertexToBuffer(front.bottomLeft, currentColor)
    vertexToBuffer(front.topRight, currentColor)
    vertexToBuffer(front.topLeft, currentColor)
    vertexToBuffer(front.bottomLeft, currentColor)
    vertexToBuffer(front.bottomRight, currentColor)
    vertexToBuffer(front.topRight, currentColor)

    // the side that is "facing the light source"
    currentColor = multiplyColor(color, 1.15)
    vertexToBuffer(back.topLeft, currentColor)
    vertexToBuffer(front.topLeft, currentColor)
    vertexToBuffer(front.topRight, currentColor)
    vertexToBuffer(back.topRight, currentColor)
    vertexToBuffer(back.topLeft, currentColor)
    vertexToBuffer(front.topRight, currentColor)

    // the side that is "facing away from the light source"
    currentColor = multiplyColor(color, 0.7)
    vertexToBuffer(back.bottomLeft, currentColor)
    vertexToBuffer(front.bottomRight, currentColor)
    vertexToBuffer(front.bottomLeft, currentColor)
    vertexToBuffer(back.bottomLeft, currentColor)
    vertexToBuffer(back.bottomRight, currentColor)
    vertexToBuffer(front.bottomRight, currentColor)

    // the other two sides
    currentColor = multiplyColor(color, 0.85)
    vertexToBuffer(back.topLeft, currentColor)
    vertexToBuffer(back.bottomLeft, currentColor)
    vertexToBuffer(front.topLeft, currentColor)
    vertexToBuffer(back.bottomLeft, currentColor)
    vertexToBuffer(front.bottomLeft, currentColor)
    vertexToBuffer(front.topLeft, currentColor)
    currentColor = multiplyColor(color, 0.85)
    vertexToBuffer(back.bottomRight, currentColor)
    vertexToBuffer(back.topRight, currentColor)
    vertexToBuffer(front.topRight, currentColor)
    vertexToBuffer(front.bottomRight, currentColor)
    vertexToBuffer(back.bottomRight, currentColor)
    vertexToBuffer(front.topRight, currentColor)

    // enable depth testing to get correct overlaps between nodes
    gl.enable(gl.DEPTH_TEST)
    gl.depthFunc(gl.LESS)

    // actually draw
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer)
    gl.bufferData(gl.ARRAY_BUFFER, this.vertexBuffer, gl.STATIC_DRAW)
    const posLocation = gl.getAttribLocation(program, 'a_position')
    gl.enableVertexAttribArray(posLocation)
    gl.vertexAttribPointer(posLocation, 3, gl.FLOAT, false, vertexSize * 4, 0)
    const colorLocation = gl.getAttribLocation(program, 'a_color')
    gl.enableVertexAttribArray(colorLocation)
    gl.vertexAttribPointer(colorLocation, 4, gl.FLOAT, false, vertexSize * 4, 3 * 4)

    gl.drawArrays(gl.TRIANGLES, 0, numVertices)
  }
}

function multiplyColor(c: ColorLike, factor: number): ColorLike {
  return {
    r: Math.min(1, Math.max(c.r * factor, 0)),
    g: Math.min(1, Math.max(c.g * factor, 0)),
    b: Math.min(1, Math.max(c.b * factor, 0)),
    a: c.a
  }
}
