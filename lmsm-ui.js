class AssemblyMode {
  constructor() {
    CodeMirror.defineSimpleMode("lmsm-assembly", {
      start: [
        {
          regex: /(?:DAT|ADD|SUB|STA|LDI|LDA|BRA|BRZ|BRP|NOOP|INP|OUT|SPUSH|SPOP|SDUP|SDROP|SSWAP|SADD|SSUB|SMUL|SDIV|SMAX|SMIN|JAL|RET|HLT|dat|add|sub|sta|ldi|lda|bra|brz|brp|noop|inp|out|spush|spop|sdup|sdrop|sswap|sadd|ssub|smul|sdiv|smax|smin|jal|ret|hlt)\b/,
          token: "keyword"
        },
        {
          regex: /\d\d/,
          token: "number",
        },
      ],
    });
  }
}