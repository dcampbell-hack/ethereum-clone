const Trie = require('../store/trie');
const Interpreter = require('./index');
const { STOP,
    ADD ,
    SUB ,
    MUL ,
    DIV ,
    PUSH ,
    LT, 
    GT ,
    EQ ,
    AND ,
    OR ,
    JUMP ,
    JUMPI,
    STORE,
    LOAD  } = Interpreter.OPCODE_MAP;

    describe('Interpreter', () => {
        describe('runCode', () => {

            describe('and the code includes ADD', () => {
                it('adds two value', () => {
                    expect(
                    new Interpreter().runCode([PUSH, 2, PUSH, 3, ADD, STOP ]).result
                    ).toEqual(5);
                })
            });

            describe('and the code includes SUB', () => {
                it('subtracts two value', () => {
                    expect(
                    new Interpreter().runCode([PUSH, 2, PUSH, 3, SUB, STOP ]).result
                    ).toEqual(1);
                })
            });

            describe('and the code includes MUL', () => {
                it('multiply two value', () => {
                    expect(
                    new Interpreter().runCode([PUSH, 2, PUSH, 3, MUL, STOP ]).result
                    ).toEqual(6);
                })
            });


            describe('and the code includes DIV', () => {
                it('div two value', () => {
                    expect(
                    new Interpreter().runCode([PUSH, 2, PUSH, 3, DIV, STOP ]).result
                    ).toEqual(1.5);
                })
            });

            describe('and the code includes LT', () => {
                it('a is less than b', () => {
                    expect(
                    new Interpreter().runCode([PUSH, 2, PUSH, 3, LT, STOP ]).result
                    ).toEqual(0);
                })
            });
            
            describe('and the code includes GT', () => {
                it('a greater than b', () => {
                    expect(
                    new Interpreter().runCode([PUSH, 2, PUSH, 3, GT, STOP ]).result
                    ).toEqual(1);
                })
            });

            describe('and the code includes EQ', () => {
                it('a equal to b', () => {
                    expect(
                    new Interpreter().runCode([PUSH, 2, PUSH, 3, EQ, STOP ]).result
                    ).toEqual(0);
                })
            });

            describe('and the code includes AND', () => {
                it('ands two condition', () => {
                    expect(
                    new Interpreter().runCode([PUSH, 1, PUSH, 0, AND, STOP ]).result
                    ).toEqual(0);
                })
            });

            describe('and the code includes OR', () => {
                it('ors two conditions', () => {
                    expect(
                    new Interpreter().runCode([PUSH, 1, PUSH, 0, OR, STOP ]).result
                    ).toEqual(1);
                })
            });

            describe('and the code includes JUMP', () => {
                it('jumps to a destination', () => {
                    expect(
                    new Interpreter().runCode(
                        [ PUSH, 6, JUMP, PUSH, 0, JUMP, PUSH, 'jump successful', STOP]).result
                    ).toEqual('jump successful');
                })
            });


            describe('and the code includes JUMPI', () => {
                it('jumps to a destination', () => {
                    expect(
                    new Interpreter().runCode([PUSH, 8, PUSH, 1, JUMPI, PUSH, 0, JUMP, PUSH, 'jump successful', STOP ]).result
                    ).toEqual( 'jump successful');
                })
            });


            describe('and the code includes a invalid JUMP destination', () => {
                it('throws an error', () => {
                    expect(
                    () => new Interpreter().runCode(
                        [PUSH, 99, JUMP, PUSH, 0, JUMP, PUSH, 'jump successful', STOP ]).result
                    ).toThrow('Invalid destination: 99');
                })
            });

            describe('and the code includes a PUSH value', () => {
                it('throws an error', () => {
                    expect(() => new Interpreter().runCode([PUSH, 0, PUSH ]).result
                    ).toThrow(`The 'PUSH' instruction cannot be last.`);
                })
            });

            describe('and the code includes a infinite loop', () => {
                it('throws an error', () => {
                    expect(() => new Interpreter().runCode([PUSH, 0, JUMP, STOP ]).result
                    ).toThrow(`Check for an infinite loop. Execution time exceeded`);
                })
            });


            describe('and the code includes STORE', () => {
                it('stores a value', () => {
                    const interpreter = new Interpreter({
                        storageTrie: new Trie()
                    });
                    const key = 'foo';
                    const value = 'bar';

                    interpreter.runCode([PUSH, value, PUSH, key, STORE, STOP]);
                    expect(interpreter.storageTrie.get({ key })).toEqual(value);
                })
            });

            describe('and the code includes LOAD', () => {
                it('loads a stored value', () => {
                    const interpreter = new Interpreter({
                        storageTrie: new Trie()
                    });
                    const key = 'foo';
                    const value = 'bar';

                    expect(
                        interpreter.runCode([PUSH, value, PUSH, key, STORE, PUSH, key, LOAD, STOP]).result
                    ).toEqual(value);

                })
            })


        })
    })