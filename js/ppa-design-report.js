/* ════════════════════════════════════════════════════════════════
   PipingPro Academy — Design Report Generator v1.0
   js/ppa-design-report.js
   ────────────────────────────────────────────────────────────────
   Converts Piping Design Agent output into a professionally
   branded Word (.docx) document for download.

   Dependencies (loaded from CDN automatically):
   - docx (browser UMD build)
   - FileSaver.js

   Usage:
     generateDesignReport(aiResponseText, { query: '...', date: '...' })
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  // ── CDN URLS ──
  const DOCX_CDN = 'https://unpkg.com/docx@8.5.0/build/index.umd.js';
  const SAVER_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js';

  // ── COLORS ──
  const GOLD = 'B8860B';
  const NAVY = '1A1510';
  const INK = '333333';
  const INK_LIGHT = '666666';
  const CREAM = 'FAF6EF';
  const RULE = 'C8B89A';
  const RUST = '8B3A1A';
  const WHITE = 'FFFFFF';

  // ── Load script from CDN (cached after first load) ──
  function loadScript(url) {
    return new Promise(function (resolve, reject) {
      if (url.includes('docx') && window.docx) { resolve(); return; }
      if (url.includes('FileSaver') && window.saveAs) { resolve(); return; }
      var s = document.createElement('script');
      s.src = url;
      s.onload = resolve;
      s.onerror = function () { reject(new Error('Failed to load ' + url)); };
      document.head.appendChild(s);
    });
  }

  // ── Parse markdown-ish AI response into sections ──
  function parseSections(text) {
    var lines = text.split('\n');
    var sections = [];
    var current = null;

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var trimmed = line.trim();

      // H1
      var h1 = trimmed.match(/^#\s+(.+)/);
      if (h1) {
        current = { level: 1, title: h1[1].replace(/\*\*/g, ''), lines: [] };
        sections.push(current);
        continue;
      }
      // H2
      var h2 = trimmed.match(/^##\s+(.+)/);
      if (h2) {
        current = { level: 2, title: h2[1].replace(/\*\*/g, ''), lines: [] };
        sections.push(current);
        continue;
      }
      // H3
      var h3 = trimmed.match(/^###\s+(.+)/);
      if (h3) {
        current = { level: 3, title: h3[1].replace(/\*\*/g, ''), lines: [] };
        sections.push(current);
        continue;
      }

      if (current) {
        current.lines.push(line);
      } else {
        // Lines before first heading
        if (!sections.length || sections[0].level !== 0) {
          sections.unshift({ level: 0, title: '', lines: [] });
        }
        sections[0].lines.push(line);
      }
    }
    return sections;
  }

  // ── Parse a markdown table into rows ──
  function parseTable(lines) {
    var rows = [];
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if (!line.startsWith('|') || !line.endsWith('|')) continue;
      if (/^[\s|:-]+$/.test(line)) continue; // separator row
      var cells = line.split('|').slice(1, -1).map(function (c) { return c.trim(); });
      rows.push(cells);
    }
    return rows;
  }

  // ── Strip markdown formatting from inline text ──
  function stripMd(text) {
    return text
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/`(.+?)`/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  }

  // ── MAIN GENERATOR ──
  async function generateDesignReport(aiText, meta) {
    meta = meta || {};

    // Load dependencies
    await loadScript(DOCX_CDN);
    await loadScript(SAVER_CDN);

    var D = window.docx;
    var today = meta.date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    var jobRef = 'PPA-' + new Date().toISOString().slice(2, 10).replace(/-/g, '') + '-' + Math.floor(Math.random() * 900 + 100);

    // Parse sections
    var sections = parseSections(aiText);

    // ── Build document children ──
    var children = [];

    // ── COVER PAGE ──
    children.push(new D.Paragraph({ spacing: { before: 2400 } }));
    children.push(new D.Paragraph({
      children: [new D.TextRun({ text: 'PipingPro Academy', bold: true, color: GOLD, font: 'Calibri', size: 48 })],
      alignment: D.AlignmentType.CENTER
    }));
    children.push(new D.Paragraph({
      children: [new D.TextRun({ text: 'Piping Design Report', bold: true, color: NAVY, font: 'Calibri', size: 36 })],
      alignment: D.AlignmentType.CENTER,
      spacing: { before: 200 }
    }));
    children.push(new D.Paragraph({
      children: [new D.TextRun({ text: 'ASME B31.3 Process Piping — Preliminary Design', color: INK_LIGHT, font: 'Calibri', size: 22 })],
      alignment: D.AlignmentType.CENTER,
      spacing: { before: 200 }
    }));

    // Job reference and date
    children.push(new D.Paragraph({ spacing: { before: 600 } }));
    children.push(new D.Paragraph({
      children: [
        new D.TextRun({ text: 'Reference: ', bold: true, font: 'Calibri', size: 20, color: INK_LIGHT }),
        new D.TextRun({ text: jobRef, font: 'Calibri', size: 20, color: INK })
      ],
      alignment: D.AlignmentType.CENTER
    }));
    children.push(new D.Paragraph({
      children: [
        new D.TextRun({ text: 'Date: ', bold: true, font: 'Calibri', size: 20, color: INK_LIGHT }),
        new D.TextRun({ text: today, font: 'Calibri', size: 20, color: INK })
      ],
      alignment: D.AlignmentType.CENTER,
      spacing: { before: 60 }
    }));

    if (meta.query) {
      children.push(new D.Paragraph({
        children: [
          new D.TextRun({ text: 'Design Request: ', bold: true, font: 'Calibri', size: 20, color: INK_LIGHT }),
          new D.TextRun({ text: meta.query, font: 'Calibri', size: 20, color: INK, italics: true })
        ],
        alignment: D.AlignmentType.CENTER,
        spacing: { before: 60 }
      }));
    }

    // Disclaimer
    children.push(new D.Paragraph({
      children: [new D.TextRun({
        text: 'PRELIMINARY DESIGN — For engineering review only. Not for construction.',
        bold: true, color: RUST, font: 'Calibri', size: 18
      })],
      alignment: D.AlignmentType.CENTER,
      spacing: { before: 400 },
      border: { top: { style: D.BorderStyle.SINGLE, size: 1, color: RUST }, bottom: { style: D.BorderStyle.SINGLE, size: 1, color: RUST } }
    }));

    children.push(new D.Paragraph({
      children: [new D.TextRun({
        text: 'Generated by PipingPro Academy AI Design Agent — www.pipingpro-academy.com',
        color: INK_LIGHT, font: 'Calibri', size: 16, italics: true
      })],
      alignment: D.AlignmentType.CENTER,
      spacing: { before: 200 }
    }));

    // Page break
    children.push(new D.Paragraph({ children: [new D.PageBreak()] }));

    // ── CONTENT PAGES ──
    var thinBorder = { style: D.BorderStyle.SINGLE, size: 1, color: RULE };
    var allBorders = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder };

    for (var si = 0; si < sections.length; si++) {
      var sec = sections[si];

      // Section heading
      if (sec.title) {
        var headingLevel;
        var fontSize;
        var headColor;
        if (sec.level === 1) {
          headingLevel = D.HeadingLevel.HEADING_1;
          fontSize = 28;
          headColor = NAVY;
        } else if (sec.level === 2) {
          headingLevel = D.HeadingLevel.HEADING_2;
          fontSize = 24;
          headColor = GOLD;
        } else {
          headingLevel = D.HeadingLevel.HEADING_3;
          fontSize = 20;
          headColor = GOLD;
        }

        children.push(new D.Paragraph({
          children: [new D.TextRun({ text: stripMd(sec.title), bold: true, color: headColor, font: 'Calibri', size: fontSize })],
          heading: headingLevel,
          spacing: { before: sec.level === 1 ? 300 : 200, after: 80 }
        }));
      }

      // Process lines within section
      var lineArr = sec.lines;
      var li = 0;
      while (li < lineArr.length) {
        var ln = lineArr[li];
        var tr = ln.trim();

        // Skip empty lines
        if (!tr) { li++; continue; }

        // Table detection
        if (tr.startsWith('|') && tr.endsWith('|')) {
          var tableLines = [];
          while (li < lineArr.length && lineArr[li].trim().startsWith('|') && lineArr[li].trim().endsWith('|')) {
            tableLines.push(lineArr[li]);
            li++;
          }
          var rows = parseTable(tableLines);
          if (rows.length >= 2) {
            var colCount = rows[0].length;
            var colWidth = Math.floor(9200 / colCount);
            var colWidths = [];
            for (var c = 0; c < colCount; c++) colWidths.push(colWidth);

            var tableRows = [];
            for (var ri = 0; ri < rows.length; ri++) {
              var cells = [];
              for (var ci = 0; ci < rows[ri].length; ci++) {
                var isHeader = (ri === 0);
                cells.push(new D.TableCell({
                  width: { size: colWidth, type: D.WidthType.DXA },
                  shading: isHeader ? { type: D.ShadingType.CLEAR, color: 'auto', fill: NAVY } : undefined,
                  children: [new D.Paragraph({
                    children: [new D.TextRun({
                      text: stripMd(rows[ri][ci]),
                      bold: isHeader,
                      color: isHeader ? WHITE : INK,
                      font: 'Calibri',
                      size: 18
                    })],
                    spacing: { before: 40, after: 40 }
                  })],
                  borders: allBorders
                }));
              }
              tableRows.push(new D.TableRow({ children: cells }));
            }

            children.push(new D.Table({
              width: { size: 9200, type: D.WidthType.DXA },
              columnWidths: colWidths,
              rows: tableRows
            }));
            children.push(new D.Paragraph({ spacing: { before: 80 } }));
          }
          continue;
        }

        // Code block / preformatted (lines starting with `)
        if (tr.startsWith('`')) {
          li++;
          continue; // skip backtick lines, content is in normal lines
        }

        // Blockquote
        if (tr.startsWith('>')) {
          children.push(new D.Paragraph({
            children: [new D.TextRun({
              text: stripMd(tr.replace(/^>\s*/, '')),
              font: 'Calibri', size: 18, italics: true, color: INK_LIGHT
            })],
            spacing: { before: 40, after: 40 },
            indent: { left: 400 },
            border: { left: { style: D.BorderStyle.SINGLE, size: 6, color: GOLD } }
          }));
          li++; continue;
        }

        // Bullet list
        if (/^[-•*]\s/.test(tr)) {
          children.push(new D.Paragraph({
            children: [new D.TextRun({
              text: '• ' + stripMd(tr.replace(/^[-•*]\s*/, '')),
              font: 'Calibri', size: 18, color: INK
            })],
            spacing: { before: 30, after: 30 },
            indent: { left: 400 }
          }));
          li++; continue;
        }

        // Numbered list
        var olMatch = tr.match(/^(\d+)[.)]\s+(.+)/);
        if (olMatch) {
          children.push(new D.Paragraph({
            children: [new D.TextRun({
              text: olMatch[1] + '. ' + stripMd(olMatch[2]),
              font: 'Calibri', size: 18, color: INK
            })],
            spacing: { before: 30, after: 30 },
            indent: { left: 400 }
          }));
          li++; continue;
        }

        // Horizontal rule
        if (/^-{3,}$/.test(tr) || /^\*{3,}$/.test(tr)) {
          children.push(new D.Paragraph({
            spacing: { before: 80, after: 80 },
            border: { bottom: { style: D.BorderStyle.SINGLE, size: 1, color: RULE } }
          }));
          li++; continue;
        }

        // Check/cross marks (result lines)
        var isResult = tr.includes('✅') || tr.includes('❌') || tr.includes('⚠');
        var resultColor = tr.includes('❌') ? RUST : (tr.includes('⚠') ? GOLD : INK);

        // Bold line detection
        var boldMatch = tr.match(/^\*\*(.+?)\*\*$/);
        if (boldMatch) {
          children.push(new D.Paragraph({
            children: [new D.TextRun({
              text: stripMd(boldMatch[1]),
              bold: true, font: 'Calibri', size: 20, color: GOLD
            })],
            spacing: { before: 80, after: 40 }
          }));
          li++; continue;
        }

        // Normal paragraph
        // Parse inline bold segments
        var parts = tr.split(/(\*\*[^*]+\*\*)/g);
        var runs = [];
        for (var pi = 0; pi < parts.length; pi++) {
          var part = parts[pi];
          if (!part) continue;
          var bm = part.match(/^\*\*(.+)\*\*$/);
          if (bm) {
            runs.push(new D.TextRun({ text: stripMd(bm[1]), bold: true, font: 'Calibri', size: 18, color: isResult ? resultColor : INK }));
          } else {
            runs.push(new D.TextRun({ text: stripMd(part), font: 'Calibri', size: 18, color: isResult ? resultColor : INK }));
          }
        }
        if (runs.length) {
          children.push(new D.Paragraph({
            children: runs,
            spacing: { before: 40, after: 40 }
          }));
        }
        li++;
      }
    }

    // ── FOOTER DISCLAIMER PAGE ──
    children.push(new D.Paragraph({ children: [new D.PageBreak()] }));
    children.push(new D.Paragraph({
      children: [new D.TextRun({ text: 'Disclaimer & Limitations', bold: true, color: RUST, font: 'Calibri', size: 24 })],
      spacing: { before: 200, after: 100 }
    }));

    var disclaimers = [
      'This report is a PRELIMINARY piping design for straight pipe only. It does not constitute a detailed engineering deliverable.',
      'Pipe fittings (elbows, tees, reducers) require separate pressure design and component rating checks.',
      'A formal pipe stress / flexibility analysis (e.g. CAESAR II) must be performed by a qualified stress engineer before construction.',
      'Material selection must be verified against the project material specification and any applicable corrosion/sour service requirements (NACE MR0175/ISO 15156).',
      'Insulation, heat tracing, pipe support spacing, and coating requirements are not addressed in this report.',
      'All data is sourced from PipingPro Academy verified ASME code databases. Users must independently verify results against the governing code edition.',
      'PipingPro Academy accepts no liability for design decisions based on this report. The responsibility for final design approval rests with the Engineer of Record.'
    ];

    for (var di = 0; di < disclaimers.length; di++) {
      children.push(new D.Paragraph({
        children: [new D.TextRun({ text: (di + 1) + '. ' + disclaimers[di], font: 'Calibri', size: 18, color: INK_LIGHT })],
        spacing: { before: 60, after: 60 },
        indent: { left: 200 }
      }));
    }

    children.push(new D.Paragraph({
      children: [new D.TextRun({
        text: '© ' + new Date().getFullYear() + ' PipingPro Academy — www.pipingpro-academy.com',
        font: 'Calibri', size: 16, color: INK_LIGHT, italics: true
      })],
      spacing: { before: 400 },
      alignment: D.AlignmentType.CENTER
    }));

    // ── BUILD DOCUMENT ──
    var doc = new D.Document({
      sections: [{
        properties: {
          page: {
            margin: { top: 1000, right: 1000, bottom: 1000, left: 1000 },
            size: { width: 12240, height: 15840 }
          }
        },
        headers: {
          default: new D.Header({
            children: [new D.Paragraph({
              children: [
                new D.TextRun({ text: 'PipingPro Academy', bold: true, color: GOLD, font: 'Calibri', size: 16 }),
                new D.TextRun({ text: '  |  Piping Design Report  |  ' + jobRef, color: INK_LIGHT, font: 'Calibri', size: 16 })
              ],
              border: { bottom: { style: D.BorderStyle.SINGLE, size: 1, color: RULE } }
            })]
          })
        },
        footers: {
          default: new D.Footer({
            children: [new D.Paragraph({
              children: [
                new D.TextRun({ text: 'PRELIMINARY — For engineering review only', color: RUST, font: 'Calibri', size: 14, italics: true }),
                new D.TextRun({ text: '          ', font: 'Calibri', size: 14 }),
                new D.TextRun({ text: 'www.pipingpro-academy.com', color: INK_LIGHT, font: 'Calibri', size: 14 })
              ],
              border: { top: { style: D.BorderStyle.SINGLE, size: 1, color: RULE } }
            })]
          })
        },
        children: children
      }]
    });

    // ── GENERATE & DOWNLOAD ──
    var blob = await D.Packer.toBlob(doc);
    var filename = 'PPA-Design-Report-' + jobRef + '.docx';
    window.saveAs(blob, filename);
    return filename;
  }

  // ── EXPOSE ──
  window.generateDesignReport = generateDesignReport;

})();
