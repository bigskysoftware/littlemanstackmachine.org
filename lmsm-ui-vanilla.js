class LMSMUi {

  lmsm = null;
  editor = null;
  assembled = null;
  mode = 'firth';
  currentLineNumber = -1;

  static makeLMSM() {
    const lmsm = new LittleManStackMachine();
    lmsm.outputFunction = (value) => {
      const elem = document.querySelector("#outputPane");
      const event = new CustomEvent("output:append", {
        detail: {
          timestamp: new Date(),
          entry: value,
        }
      });
      elem.dispatchEvent(event);
    }
    return lmsm;
  }
  constructor() {
    this.lmsm = LMSMUi.makeLMSM();

    CodeMirror.defineSimpleMode('lmsm-assembly', {
      start: [
        {
          regex: /(?:DAT|ADD|SUB|STA|LDI|LDA|BRA|BRZ|BRP|NOOP|INP|OUT|SPUSH|SPOP|SDUP|SDROP|SSWAP|SADD|SSUB|SMUL|SDIV|SMAX|SMIN|JAL|RET|HLT|dat|add|sub|sta|ldi|lda|bra|brz|brp|noop|inp|out|spush|spop|sdup|sdrop|sswap|sadd|ssub|smul|sdiv|smax|smin|jal|ret|hlt)\b/,
          token: 'keyword'
        },
        {
          regex: /\d\d/,
          token: 'number',
        },
      ],
    });
    CodeMirror.defineSimpleMode('firth', {
      start: [
        {
          regex: /(?:def|loop|get|else|stop|var|return|swap|end|dup|do)\b/,
          token: 'keyword'
        },
        {
          regex: /zero\?/,
          token: 'keyword',
        },
        {
          regex: /asm/,
          token: 'keyword',
          mode: { spec: 'lmsm-assembly', end: /end/ }
        },
        {
          regex: /\*/,
          token: 'operator'
        },
        {
          regex: /\d\d/,
          token: 'number',
        },
      ],
    });
    this.editor = CodeMirror(document.querySelector('#codeEditor'), {
      lineNumbers: true,
      tabSize: 2,
    });
    this.editor.setSize('100%', '50em');
    this.editor.setOption('mode', this.mode);
  }
  setMode(mode) {
    this.mode = mode;
    this.editor.setOption('mode', this.mode);
  }
  resetEditor() {
    if (this.currentLineNumber !== -1) {
      this.editor.getDoc().removeLineClass(this.currentLineNumber, 'background', 'markCode');
    }
    this.currentLineNumber = -1;
  }
  compile() {
    this.lmsm = LMSMUi.makeLMSM();
    this.resetEditor();
    const code = this.editor.getValue();
    const compiled = this.lmsm.compile(code);
    this.assembled = this.lmsm.assemble(compiled);
    this.lmsm.load(this.assembled);
  }
  assemble() {
    this.lmsm = LMSMUi.makeLMSM();
    this.resetEditor();
    const code = this.editor.getValue();
    this.assembled = this.lmsm.assemble(code);
    this.lmsm.load(this.assembled);
    return this.assembled;
  }
  run() {
    if (this.lmsm.status === 'Stopped') {
      this.setProgramCounter(0);
      this.lmsm.status = "Ready";
    }
    this.lmsm.run();
  }
  assembleAndRun() {
    this.lmsm = LMSMUi.makeLMSM();
    this.resetEditor();
    const code = this.editor.getValue();
    this.lmsm.assembleAndRun(code);
  }
  step() {
    if (this.lmsm.status === "Stopped") {
      this.resetEditor();
      this.setProgramCounter(0);
      this.lmsm.status = "Reeady";
    }
    if (this.currentLineNumber !== -1) {
      this.editor.getDoc()
        .removeLineClass(this.currentLineNumber, 'background', 'markCode');
      this.lmsm.step();
    }
    this.currentLineNumber++;
    this.editor.getDoc()
      .addLineClass(this.currentLineNumber, 'background', 'markCode');
  }
  getProgramCounter() {
    return this.lmsm.registers.program_counter;
  }

  setProgramCounter(value) {
    this.lmsm.registers.program_counter = value;
  }

  getAccumulator() {
    return this.lmsm.registers.accumulator;
  }
  setAccumulator(value) {
    this.lmsm.registers.accumulator = value;
  }

  getCurrentInstruction() {
    return this.lmsm.registers.current_instruction;
  }
  setCurrentInstruction(value) {
    this.lmsm.registers.current_instruction = value;
  }

  getStackPointer() {
    return this.lmsm.registers.stack_pointer;
  }

  setStackPointer(value) {
    this.lmsm.registers.stack_pointer = value;
  }

  getReturnAddressPointer() {
    return this.lmsm.registers.return_address_pointer;
  }

  setReturnAddressPointer(value) {
    this.lmsm.registers.return_address_pointer = value;
  }

  getMemory(mempos) {
    return this.lmsm.memory[mempos] == null ? null : this.lmsm.memory[mempos];
  }

  setMemory(position, value) {
    this.lmsm.setMemory(position, value);
    document.querySelector("")
  }

  cellClass(mempos) {
    if (this.lmsm.registers.program_counter == mempos)
      return 'memory_slot program_counter'
    else if (this.lmsm.registers.stack_pointer === mempos)
      return 'memory_slot stack_pointer'
    else if (this.lmsm.registers.return_address_pointer === mempos)
      return 'memory_slot return_address_pointer'
    else return 'memory_slot';
  }

}