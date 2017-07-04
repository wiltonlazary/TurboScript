import {FileSystem} from "../utils/filesystem";
import {WasmBinary} from "../backends/webassembly/wasm/wasm-binary";
import {WasmSection} from "../backends/webassembly/core/wasm-section";
import {ExportSection} from "../backends/webassembly/wasm/sections/export-section";
import {WasmExport} from "../backends/webassembly/core/wasm-export";
import {SignatureSection} from "../backends/webassembly/wasm/sections/signature-section";
import {FunctionSection} from "../backends/webassembly/wasm/sections/function-section";
import {WasmExternalKind} from "../backends/webassembly/core/wasm-external-kind";
import {Terminal} from "../utils/terminal";
import {WasmBinaryImport} from "./kinds/wasm-binary-import";
import {ImportSection} from "../backends/webassembly/wasm/sections/import-section";
/**
 * Created by n.vinayakan on 23.06.17.
 */
export class BinaryImporter {
    static binaries: WasmBinary[] = [];
    static imports: WasmBinaryImport[] = [];

    static reset(): void {
        BinaryImporter.binaries = [];
        BinaryImporter.imports = [];
    }

    static resolveWasmBinaryImport(imports: string[], from: string, importPath: string): string {
        let binary;
        if (FileSystem.existsSync(importPath)) {
            binary = FileSystem.readBinaryFile(importPath);
        }
        if (binary === null || binary === undefined) {
            binary = FileSystem.readBinaryFile(from);
        }
        if (binary === null || binary === undefined) {
            let error = `Cannot find wasm binary! [file: ${importPath}]`;
            Terminal.error(error);
            throw error;
        }
        let wasmBinary = new WasmBinary(binary);
        let importSection = wasmBinary.getSection(WasmSection.Import) as ImportSection;
        let importCount = importSection.imports.length;
        let exportSection = wasmBinary.getSection(WasmSection.Export) as ExportSection;
        let signatureSection = wasmBinary.getSection(WasmSection.Signature) as SignatureSection;
        let functionSection = wasmBinary.getSection(WasmSection.Function) as FunctionSection;
        let declarations = "";
        if (exportSection !== null && signatureSection !== null && functionSection !== null) {
            let exports: WasmExport[] = exportSection.exports;
            if (exports.length > 0) {
                imports.forEach(_import => {
                    let matchedExport = exports.find(_export => _export.name === _import);
                    if (matchedExport !== undefined && matchedExport.kind === WasmExternalKind.Function) {
                        let _function = functionSection.functions[matchedExport.index - importCount];
                        let signature = signatureSection.signatures[_function.signatureIndex];
                        let binaryImport: WasmBinaryImport = new WasmBinaryImport(_import, signature, matchedExport.index);
                        declarations += binaryImport.declaration + "\n";
                        BinaryImporter.imports.push(binaryImport);
                    } else {
                        let error = `Cannot find function ${_import} in wasm binary ${from}`;
                        Terminal.error(error);
                        throw error;
                    }
                });
                BinaryImporter.binaries.push(wasmBinary);
            }
        }
        return declarations;
    }

    static get
}

export function isBinaryImport(name: string): boolean {
    let found: boolean = false;
    BinaryImporter.imports.some(_import => {
        found = _import.name === name;
        return found;
    });
    return found;
}

export function getMergedCallIndex(name: string): int32 {
    let __import: WasmBinaryImport;
    BinaryImporter.imports.some(_import => {
        if (_import.name === name) {
            __import = _import;
            return true;
        }
        return false;
    });
    if (__import !== undefined) {
        return __import.functionIndex
    } else {
        let error = "Cannot find imported function index of " + name;
        Terminal.error(error);
        throw error;
    }
}
