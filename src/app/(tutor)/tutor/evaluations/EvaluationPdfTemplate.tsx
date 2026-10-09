import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

export type PdfData = {
  studentName: string;
  className: string;
  period: string;
  tutorName: string;
  listeningScore: number | string;
  listeningNote: string;
  speakingScore: number | string;
  speakingNote: string;
  readingScore: number | string;
  readingNote: string;
  pronunciationScore: number | string;
  pronunciationNote: string;
  vocabularyScore: number | string;
  vocabularyNote: string;
  strengths: string;
  improvements: string;
  nextTarget: string;
  tutorNote: string;
};

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 11,
    lineHeight: 1.5
  },
  headerContainer: {
    textAlign: 'center',
    marginBottom: 20,
    borderBottom: '1pt solid black',
    paddingBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4
  },
  subtitle: {
    fontSize: 14,
    fontWeight: 'bold'
  },
  infoTable: {
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 4
  },
  infoLabel: {
    width: 80,
    fontWeight: 'bold'
  },
  infoValue: {
    flex: 1,
  },
  table: {
    width: '100%',
    marginTop: 15,
    marginBottom: 20
  },
  tableHeaderRow: {
    flexDirection: 'row',
    border: '1pt solid black',
    backgroundColor: '#f0f0f0',
    fontWeight: 'bold'
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1pt solid black',
    borderLeft: '1pt solid black',
    borderRight: '1pt solid black'
  },
  tableColHeader: {
    width: '20%',
    borderRight: '1pt solid black',
    padding: 6
  },
  tableColScore: {
    width: '15%',
    borderRight: '1pt solid black',
    padding: 6,
    textAlign: 'center'
  },
  tableColNote: {
    width: '65%',
    padding: 6
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  sectionBox: {
    border: '1pt solid black',
    padding: 8,
    minHeight: 40,
  },
  boldText: {
    fontWeight: 'bold',
  }
});

export const EvaluationPdfTemplate = ({ data }: { data: PdfData }) => (
  <Document>
    <Page size="A4" style={styles.page}>

      {/* Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.title}>EVALUASI PROGRESS BELAJAR</Text>
        <Text style={styles.subtitle}>KAMPUNG INGGRIS SOLO</Text>
      </View>

      {/* Student Info */}
      <View style={styles.infoTable}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Nama</Text>
          <Text style={styles.infoValue}>: {data.studentName}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Kelas/Level</Text>
          <Text style={styles.infoValue}>: {data.className}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Periode</Text>
          <Text style={styles.infoValue}>: {data.period}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Tentor</Text>
          <Text style={styles.infoValue}>: {data.tutorName}</Text>
        </View>
      </View>

      {/* Main Table */}
      <View style={styles.table}>
        {/* Header Row */}
        <View style={styles.tableHeaderRow} wrap={false}>
          <View style={styles.tableColHeader}><Text>Aspek</Text></View>
          <View style={styles.tableColScore}><Text>Skor (1-5)</Text></View>
          <View style={styles.tableColNote}><Text>Catatan Perkembangan</Text></View>
        </View>

        {/* Listening Row */}
        <View style={styles.tableRow} wrap={false}>
          <View style={styles.tableColHeader}><Text>Listening</Text></View>
          <View style={styles.tableColScore}><Text>{data.listeningScore}</Text></View>
          <View style={styles.tableColNote}><Text>{data.listeningNote}</Text></View>
        </View>

        {/* Speaking Row */}
        <View style={styles.tableRow} wrap={false}>
          <View style={styles.tableColHeader}><Text>Speaking</Text></View>
          <View style={styles.tableColScore}><Text>{data.speakingScore}</Text></View>
          <View style={styles.tableColNote}><Text>{data.speakingNote}</Text></View>
        </View>

        {/* Reading Row */}
        <View style={styles.tableRow} wrap={false}>
          <View style={styles.tableColHeader}><Text>Reading</Text></View>
          <View style={styles.tableColScore}><Text>{data.readingScore}</Text></View>
          <View style={styles.tableColNote}><Text>{data.readingNote}</Text></View>
        </View>

        {/* Pronunciation Row */}
        <View style={styles.tableRow} wrap={false}>
          <View style={styles.tableColHeader}><Text>Pronunciation</Text></View>
          <View style={styles.tableColScore}><Text>{data.pronunciationScore}</Text></View>
          <View style={styles.tableColNote}><Text>{data.pronunciationNote}</Text></View>
        </View>

        {/* Vocabulary Row */}
        <View style={styles.tableRow} wrap={false}>
          <View style={styles.tableColHeader}><Text>Vocabulary</Text></View>
          <View style={styles.tableColScore}><Text>{data.vocabularyScore}</Text></View>
          <View style={styles.tableColNote}><Text>{data.vocabularyNote}</Text></View>
        </View>
      </View>

      {/* Summary Sections */}
      <View style={styles.section} wrap={false}>
        <Text style={styles.sectionTitle}>1. Catatan Kekuatan & Area yang Perlu Ditingkatkan</Text>
        <View style={styles.sectionBox}>
          <Text style={styles.boldText}>Kekuatan:</Text>
          <Text>{data.strengths}</Text>
          <Text>{'\n'}</Text>
          <Text style={styles.boldText}>Perlu Ditingkatkan:</Text>
          <Text>{data.improvements}</Text>
        </View>
      </View>

      <View style={styles.section} wrap={false}>
        <Text style={styles.sectionTitle}>2. Target Selanjutnya</Text>
        <View style={styles.sectionBox}>
          <Text>{data.nextTarget}</Text>
        </View>
      </View>

      <View style={styles.section} wrap={false}>
        <Text style={styles.sectionTitle}>3. Catatan Tentor</Text>
        <View style={styles.sectionBox}>
          <Text>{data.tutorNote}</Text>
        </View>
      </View>

    </Page>
  </Document>
);
