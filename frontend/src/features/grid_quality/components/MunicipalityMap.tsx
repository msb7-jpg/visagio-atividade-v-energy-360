import { DEC_BANDS, bandOf } from '@/features/grid_quality/utils/continuityBands'
import { layoutColumn } from '@/features/grid_quality/utils/mapLabelLayout'
import { MAP_HEIGHT, MAP_WIDTH, MUNICIPALITY_SHAPES } from '@/features/grid_quality/utils/municipalityShapes'
import type { MunicipalityShape } from '@/features/grid_quality/utils/municipalityShapes'
import { formatDecimal } from '@/features/grid_quality/utils/qualityFormatters'
import type { MunicipalityDec } from '@/features/grid_quality/types/continuityTypes'

const LABEL_COLUMN = 150
const LABEL_MARGIN = 12
const VIEW_WIDTH = LABEL_COLUMN * 2 + MAP_WIDTH
const LINE_HEIGHT = 13

interface PlacedShape {
  shape: MunicipalityShape
  decHours: number
  labelY: number
}

function placeShapes(municipalities: MunicipalityDec[]): PlacedShape[] {
  const decByName = new Map(municipalities.map((municipality) => [municipality.name, municipality.decHours]))
  const shown = MUNICIPALITY_SHAPES.filter((shape) => decByName.has(shape.name))
  const heights = new Map<string, number>()
  for (const side of ['left', 'right'] as const) {
    const anchors = shown
      .filter((shape) => shape.side === side)
      .map((shape) => ({ name: shape.name, centroidY: shape.centroid[1] }))
    layoutColumn(anchors, LABEL_MARGIN, MAP_HEIGHT - LINE_HEIGHT).forEach((height, name) => heights.set(name, height))
  }
  return shown.map((shape) => ({
    shape,
    decHours: decByName.get(shape.name) ?? 0,
    labelY: heights.get(shape.name) ?? shape.centroid[1]
  }))
}

function MunicipalityLabel({ shape, decHours, labelY }: PlacedShape) {
  const onLeft = shape.side === 'left'
  const textX = onLeft ? LABEL_COLUMN - LABEL_MARGIN : LABEL_COLUMN + MAP_WIDTH + LABEL_MARGIN
  const lineEndX = onLeft ? textX + 4 : textX - 4
  const [centroidX, centroidY] = shape.centroid
  const guidePoints = `${LABEL_COLUMN + centroidX},${centroidY} ${lineEndX},${labelY - 4}`
  return (
    <g aria-hidden="true">
      {/* Halo claro sob o traço escuro: nenhuma cor única passa de 3:1 nas 4 faixas nos dois temas. */}
      <polyline points={guidePoints} fill="none" stroke="var(--color-card)" strokeWidth={3} strokeLinecap="round" />
      <polyline points={guidePoints} fill="none" stroke="var(--color-foreground)" strokeWidth={1} strokeLinecap="round" />
      <circle cx={LABEL_COLUMN + centroidX} cy={centroidY} r={2} fill="var(--color-foreground)" />
      <text x={textX} y={labelY} textAnchor={onLeft ? 'end' : 'start'} fontSize={11} fill="var(--color-muted-foreground)">
        {shape.name}
      </text>
      <text
        x={textX}
        y={labelY + LINE_HEIGHT}
        textAnchor={onLeft ? 'end' : 'start'}
        fontSize={11}
        fontWeight={700}
        fill="var(--color-foreground)"
      >
        {formatDecimal(decHours)} h
      </text>
    </g>
  )
}

/**
 * Mapa da Região Metropolitana do Recife com o contorno real de cada município, colorido pela faixa de DEC.
 *
 * Os nomes ficam em duas colunas fora do mapa, ligados ao município por uma linha, para nunca se sobreporem.
 *
 * @param props - Municípios com DEC do período B.
 * @returns Legenda das faixas e o mapa em SVG; municípios sem contorno conhecido ficam só na lista ao lado.
 */
export function MunicipalityMap({ municipalities }: { municipalities: MunicipalityDec[] }) {
  const placed = placeShapes(municipalities)
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-4">
        {DEC_BANDS.map((band) => (
          <span key={band.label} className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <span className={`${band.swatch} size-2.5 rounded-full`} />
            {band.label}
          </span>
        ))}
      </div>
      <svg viewBox={`0 0 ${VIEW_WIDTH} ${MAP_HEIGHT}`} role="img" aria-label="Mapa do DEC por município" className="w-full">
        <g transform={`translate(${LABEL_COLUMN} 0)`}>
          {placed.map(({ shape, decHours }) => (
            <path
              key={shape.name}
              d={shape.path}
              fill={bandOf(decHours).fill}
              stroke="var(--color-card)"
              strokeWidth={1}
              className="transition-opacity hover:opacity-75"
            >
              <title>{`${shape.name}: ${formatDecimal(decHours)} h (${bandOf(decHours).label})`}</title>
            </path>
          ))}
        </g>
        {placed.map((placedShape) => (
          <MunicipalityLabel key={placedShape.shape.name} {...placedShape} />
        ))}
      </svg>
      <p className="text-muted-foreground text-xs">Contornos dos municípios: malha municipal do IBGE. O mar fica à direita.</p>
    </div>
  )
}
