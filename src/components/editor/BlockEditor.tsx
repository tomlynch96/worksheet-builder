import type { Block, DataBlock, OakContext } from '../../types/worksheet'
import type { WorksheetAction } from '../../hooks/useWorksheet'
import { HeaderEditor } from './blocks/HeaderEditor'
import { InstructionsEditor } from './blocks/InstructionsEditor'
import { QuestionEditor } from './blocks/QuestionEditor'
import { MultipleChoiceEditor } from './blocks/MultipleChoiceEditor'
import { WorkedExampleEditor } from './blocks/WorkedExampleEditor'
import { InformationEditor } from './blocks/InformationEditor'
import { MatchThemUpEditor } from './blocks/MatchThemUpEditor'
import { ClozeEditor } from './blocks/ClozeEditor'
import { OrderStepsEditor } from './blocks/OrderStepsEditor'
import { FigureEditor } from './blocks/FigureEditor'
import { SpacerEditor } from './blocks/SpacerEditor'
import { DataEditor } from './blocks/DataEditor'
import { NumericalAnswersEditor } from './blocks/NumericalAnswersEditor'

interface Props {
  block: Block
  blocks: Block[]
  dispatch: React.Dispatch<WorksheetAction>
  oakContext?: OakContext
}

export function BlockEditor({ block, blocks, dispatch, oakContext }: Props) {
  switch (block.type) {
    case 'header':          return <HeaderEditor block={block} dispatch={dispatch} />
    case 'instructions':    return <InstructionsEditor block={block} dispatch={dispatch} />
    case 'question':        return <QuestionEditor block={block} blocks={blocks} dispatch={dispatch} />
    case 'multiple_choice': return <MultipleChoiceEditor block={block} blocks={blocks} dispatch={dispatch} />
    case 'worked_example':  return <WorkedExampleEditor block={block} dispatch={dispatch} />
    case 'information':     return <InformationEditor block={block} dispatch={dispatch} />
    case 'match_them_up':   return <MatchThemUpEditor block={block} dispatch={dispatch} />
    case 'cloze':           return <ClozeEditor block={block} dispatch={dispatch} />
    case 'order_steps':     return <OrderStepsEditor block={block} dispatch={dispatch} />
    case 'figure':             return <FigureEditor block={block} dispatch={dispatch} oakImages={oakContext?.images} />
    case 'spacer':             return <SpacerEditor block={block} dispatch={dispatch} />
    case 'data':               return <DataEditor block={block as DataBlock} dispatch={dispatch} blocks={blocks} />
    case 'numerical_answers':  return <NumericalAnswersEditor block={block} dispatch={dispatch} />
  }
}
