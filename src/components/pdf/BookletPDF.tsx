import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import type { Worksheet } from '../../types/worksheet'
import { WorksheetDocumentPages, WorksheetMarkSchemePage, getPDFRenderableBlocks } from './WorksheetPDF'
import { splitIntoPages } from '../../utils/pagination'

// ── Styles ────────────────────────────────────────────────

const s = StyleSheet.create({
  // Title page
  titlePage: {
    backgroundColor: '#ffffff',
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: 0,
    paddingRight: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titlePageInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 60,
    paddingVertical: 80,
    width: '100%',
  },
  titleBookletLabel: {
    fontSize: 10,
    color: '#9ca3af',
    fontFamily: 'Helvetica',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 24,
  },
  titleDivider: {
    borderTopWidth: 2,
    borderTopColor: '#4f46e5',
    width: 80,
    marginBottom: 24,
  },
  titleText: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 28,
    color: '#111827',
    textAlign: 'center',
    lineHeight: 1.3,
    marginBottom: 16,
  },
  subtitleText: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Helvetica',
    textAlign: 'center',
    lineHeight: 1.5,
    marginBottom: 40,
  },
  titlePageFooter: {
    position: 'absolute',
    bottom: 48,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  titlePageFooterText: {
    fontSize: 9,
    color: '#9ca3af',
    fontFamily: 'Helvetica',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // Contents page
  contentsPage: {
    fontFamily: 'Helvetica',
    fontSize: 11,
    color: '#000',
    paddingTop: 56,
    paddingBottom: 56,
    paddingLeft: 56,
    paddingRight: 56,
  },
  contentsHeading: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 18,
    color: '#1a1a2e',
    marginBottom: 10,
  },
  contentsRule: {
    borderTopWidth: 1.5,
    borderTopColor: '#1a1a2e',
    marginBottom: 20,
  },
  contentsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  contentsIndex: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9.5,
    color: '#6b7280',
    width: 22,
    flexShrink: 0,
    paddingTop: 1,
  },
  contentsTextBlock: {
    flex: 1,
    paddingRight: 8,
  },
  contentsTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10.5,
    color: '#111827',
    marginBottom: 2,
  },
  contentsQualLabel: {
    fontSize: 9,
    color: '#6b7280',
    fontFamily: 'Helvetica',
  },
  contentsDots: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
    borderBottomStyle: 'dotted',
    marginHorizontal: 6,
    marginBottom: 4,
  },
  contentsPageNum: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10.5,
    color: '#374151',
    width: 22,
    textAlign: 'right',
    flexShrink: 0,
    paddingTop: 1,
  },

  // Shared page number footer
  pageNumber: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 8,
    color: '#9ca3af',
  },
})

// ── Types ─────────────────────────────────────────────────

export interface BookletEntry {
  id: string
  title: string
  topic: string
  qualLabel: string
  worksheet: Worksheet
}

interface Props {
  bookletTitle: string
  bookletSubtitle?: string
  entries: BookletEntry[]
}

// ── Page count estimation ─────────────────────────────────

function estimatePageCount(worksheet: Worksheet): number {
  const renderableBlocks = getPDFRenderableBlocks(worksheet)
  const pages = splitIntoPages(renderableBlocks)
  return Math.max(1, pages.length)
}

// ── Component ─────────────────────────────────────────────

export function BookletPDF({ bookletTitle, bookletSubtitle, entries }: Props) {
  // Page 1 = title, page 2 = contents, worksheets start at page 3
  const contentsRows = entries.reduce<Array<{ entry: BookletEntry; startPage: number }>>(
    (acc, entry, i) => {
      const prev = acc[i - 1]
      const startPage = prev ? prev.startPage + estimatePageCount(prev.entry.worksheet) : 3
      return [...acc, { entry, startPage }]
    },
    [],
  )

  // Mark schemes follow all worksheets
  const totalWorksheetPages = entries.reduce((sum, e) => sum + estimatePageCount(e.worksheet), 0)
  const markSchemesStartPage = 3 + totalWorksheetPages

  return (
    <Document>
      {/* Title page */}
      <Page size="A4" style={s.titlePage}>
        <View style={s.titlePageInner}>
          <Text style={s.titleBookletLabel}>Worksheet Booklet</Text>
          <View style={s.titleDivider} />
          <Text style={s.titleText}>{bookletTitle}</Text>
          {bookletSubtitle ? (
            <Text style={s.subtitleText}>{bookletSubtitle}</Text>
          ) : null}
        </View>
        <View style={s.titlePageFooter}>
          <Text style={s.titlePageFooterText}>Worksheet Booklet</Text>
        </View>
        <Text
          fixed
          style={s.pageNumber}
          render={({ pageNumber }) => String(pageNumber)}
        />
      </Page>

      {/* Contents page */}
      <Page size="A4" style={s.contentsPage}>
        <Text style={s.contentsHeading}>Contents</Text>
        <View style={s.contentsRule} />
        {contentsRows.map(({ entry, startPage }, i) => (
          <View key={entry.id} style={s.contentsRow} wrap={false}>
            <Text style={s.contentsIndex}>{i + 1}.</Text>
            <View style={s.contentsTextBlock}>
              <Text style={s.contentsTitle}>{entry.title}</Text>
              {entry.qualLabel ? (
                <Text style={s.contentsQualLabel}>{entry.qualLabel}</Text>
              ) : null}
            </View>
            <View style={s.contentsDots} />
            <Text style={s.contentsPageNum}>{startPage}</Text>
          </View>
        ))}
        {entries.length > 0 && (
          <View style={[s.contentsRow, { marginTop: 12, borderBottomWidth: 0 }]} wrap={false}>
            <Text style={s.contentsIndex} />
            <View style={s.contentsTextBlock}>
              <Text style={[s.contentsTitle, { fontStyle: 'italic', color: '#374151' }]}>Mark Schemes</Text>
            </View>
            <View style={s.contentsDots} />
            <Text style={s.contentsPageNum}>{markSchemesStartPage}</Text>
          </View>
        )}
        <Text
          fixed
          style={s.pageNumber}
          render={({ pageNumber }) => String(pageNumber)}
        />
      </Page>

      {/* All worksheet pages */}
      {entries.map(entry => (
        <WorksheetDocumentPages
          key={entry.id}
          worksheet={entry.worksheet}
          showPageNumbers
        />
      ))}

      {/* All mark schemes at the end */}
      {entries.map(entry => (
        <WorksheetMarkSchemePage
          key={entry.id}
          worksheet={entry.worksheet}
          showPageNumbers
        />
      ))}
    </Document>
  )
}
