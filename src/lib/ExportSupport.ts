import { GraphComponent, IGraph, Rect, Size, SvgExport } from 'yfiles'
import { FileIoSupport } from './FileIoSupport'

export enum ExportFormat {
  SVG = 'SVG-FORMAT',
  PNG = 'PNG-FORMAT',
  PDF = 'PDF-FORMAT',
}

export class ExportSupport {
  /**
   * Creates an SVG element that can be exported to different formats.
   * @param graph The graph to be exported.
   * @param exportArea The area to be exported.
   * @param scale The scale of the exported graph.
   * @returns {Promise<{size: Size, svgElement: SVGSVGElement}>}
   * @yjs:keep=viewBox
   */
  static prepareSvg(graph: IGraph, exportArea: Rect, scale: number) {
    // Create a new graph control for exporting the original SVG content
    const exportControl = new GraphComponent()
    exportControl.graph = graph

    exportControl.updateContentRect()

    // Determine the bounds of the exported area
    exportControl.zoomTo(exportArea)

    // Create the exporter class
    const exporter = new SvgExport(exportArea, scale)

    if (window.btoa !== undefined) {
      exporter.inlineSvgImages = true
    }

    // export only if some content is available
    return exporter.exportSvgAsync(exportControl).then((svgElement) => {
      const {
        width: exportWidth,
        height: exportHeight,
      } = (svgElement as SVGSVGElement).viewBox.baseVal

      return {
        svgElement: svgElement as SVGSVGElement,
        size: new Size(exportWidth, exportHeight),
      }
    })
  }

  /**
   * Saves the graph as SVG file.
   * @param graph The graph to be exported.
   * @param exportArea The area to be exported.
   * @param scale The scale of the exported graph.
   */
  static saveSvg(graph: IGraph, exportArea: Rect, scale: number) {
    ExportSupport.prepareSvg(graph, exportArea, scale).then((result) => {
      const documentName = 'export'
      ExportSupport.downloadSvg(
        result.svgElement,
        result.size,
        documentName,
        ExportFormat.SVG
      )
    })
  }

  /**
   * Saves the graph as PNG file.
   * @param graph The graph to be exported.
   * @param exportArea The area to be exported.
   * @param scale The scale of the exported graph.
   */
  static savePng(graph: IGraph, exportArea: Rect, scale: number) {
    ExportSupport.prepareSvg(graph, exportArea, scale).then((result) => {
      const svgElement = result.svgElement
      const size = result.size
      const documentName = 'export'
      ExportSupport.downloadSvg(
        svgElement,
        size,
        documentName,
        ExportFormat.PNG
      )
    })
  }

  /**
   * Saves the graph as PDF file.
   */
  static savePdf(graph: IGraph, exportArea: Rect, scale: number) {
    ExportSupport.prepareSvg(graph, exportArea, scale).then((result) => {
      const svgElement = result.svgElement.cloneNode(true) as SVGSVGElement
      const size = result.size
      const documentName = 'export'

      ExportSupport.downloadSvg(
        svgElement,
        size,
        documentName,
        ExportFormat.PDF
      )
    })
  }

  /**
   * Downloads the given svg element to a file on the client
   */
  static async downloadSvg(
    svg: SVGSVGElement,
    size: Size,
    name: string,
    format: ExportFormat
  ) {
    if (format === ExportFormat.PNG) {
      const targetCanvas = document.createElement('canvas')
      const targetContext = targetCanvas.getContext('2d')

      const svgUrl = SvgExport.encodeSvgDataUrl(SvgExport.exportSvgString(svg))

      if (!targetContext) {
        return
      }

      // The SVG image is now used as the source of an HTML image element,
      // which is then rendered onto a canvas element.

      // An image that gets the export SVG in the Data URL format
      const svgImage = new Image()
      svgImage.src = svgUrl

      svgImage.onload = () => {
        targetContext.clearRect(0, 0, targetCanvas.width, targetCanvas.height)
        targetCanvas.width = size.width
        targetCanvas.height = size.height

        targetContext.drawImage(svgImage, 0, 0)

        // When the svg image has been rendered to the Canvas,
        // the raster image can be exported from the Canvas.
        const pngImage = new Image()
        // The following 'toDataURL' function throws a security error in IE
        pngImage.src = targetCanvas.toDataURL('image/png')
        pngImage.onload = () => {
          FileIoSupport.saveToFile(pngImage.src, `${name}.png`)
        }
      }
    } else if (format === ExportFormat.SVG) {
      FileIoSupport.saveToFile(SvgExport.exportSvgString(svg), `${name}.svg`)
    } else if (format === ExportFormat.PDF) {
      const sizeArray = new Array(2)
      sizeArray[0] = size.width
      sizeArray[1] = size.height

      const [jsPdfModule] = await Promise.all([
        // @ts-ignore
        import(/* webpackChunkName: "jspdf" */ 'jspdf'),
        // @ts-ignore
        import(/* webpackChunkName: "svg2pdf" */ 'svg2pdf.js'),
      ])

      // eslint-disable-next-line no-undef,new-cap
      const doc = new jsPdfModule.default({
        orientation: size.width > size.height ? 'l' : 'p',
        unit: 'pt',
        format: sizeArray,
        compress: true,
      })
      try {
        // eslint-disable-next-line no-undef
        doc.svg(svg).then(() => {
          FileIoSupport.saveToFile(doc.output(), `${name}.pdf`)
        })
      } catch (e) {
        throw new Error('Error during PDF export.')
      }
    }
  }
}
