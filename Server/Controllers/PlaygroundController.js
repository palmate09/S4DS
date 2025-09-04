import { exec } from 'child_process';
import util from 'util';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const execAsync = util.promisify(exec);

// Helper function to create temporary files
const createTempFile = async (code, extension) => {
    const tempDir = path.join(process.cwd(), 'temp');
    const fileName = `${uuidv4()}.${extension}`;
    const filePath = path.join(tempDir, fileName);
    
    // Ensure temp directory exists
    try {
        await fs.mkdir(tempDir, { recursive: true });
    } catch (error) {
        // no-op
    }
    
    await fs.writeFile(filePath, code);
    return { filePath, fileName };
};

// Helper function to clean up temporary files
const cleanupTempFile = async (filePath) => {
    try {
        await fs.unlink(filePath);
    } catch (error) {
        // no-op
    }
};

// Helper function to execute code with timeout
const executeWithTimeout = async (command, options = {}) => {
    const timeout = options.timeout || 10000;
    try {
        const { stdout, stderr } = await execAsync(command, { 
            timeout,
            maxBuffer: 1024 * 1024, // 1MB buffer
            cwd: options.cwd
        });
        return { success: true, output: stdout.trim(), error: stderr.trim() };
    } catch (error) {
        if (error.code === 'ETIMEDOUT') {
            return { success: false, output: '', error: 'Execution timed out' };
        }
        const errorOutput = error.stderr || error.stdout || error.message;
        return { success: false, output: '', error: errorOutput };
    }
};

// Run Python code
export const runPython = async (req, res) => {
    try {
        const { code } = req.body;

        if (!code) {
            return res.status(400).json({ 
                success: false, 
                error: 'Code is required' 
            });
        }

        const { filePath } = await createTempFile(code, 'py');

        try {
            const result = await executeWithTimeout(`python3 "${filePath}"`);
            
            if (result.success) {
                return res.status(200).json({
                    success: true,
                    output: result.output,
                    error: result.error || ''
                });
            } else {
                return res.status(400).json({
                    success: false,
                    output: '',
                    error: result.error
                });
            }
        } finally {
            await cleanupTempFile(filePath);
        }

    } catch (error) {
        return res.status(500).json({
            success: false,
            error: 'Internal server error during Python execution'
        });
    }
};

// Run JavaScript code
export const runJavascript = async (req, res) => {
    try {
        const { code } = req.body;

        if (!code) {
            return res.status(400).json({ 
                success: false, 
                error: 'Code is required' 
            });
        }

        const { filePath } = await createTempFile(code, 'js');

        try {
            const result = await executeWithTimeout(`node "${filePath}"`);
            
            if (result.output || result.error) {
                return res.status(200).json({
                    success: true,
                    output: result.output || result.error,
                    error: ''
                });
            } else {
                return res.status(400).json({
                    success: false,
                    output: '',
                    error: 'No output generated'
                });
            }
        } finally {
            await cleanupTempFile(filePath);
        }

    } catch (error) {
        return res.status(500).json({
            success: false,
            error: 'Internal server error during JavaScript execution'
        });
    }
};

// Run C++ code
export const runCpp = async (req, res) => {
    try {
        const { code } = req.body;

        if (!code) {
            return res.status(400).json({ 
                success: false, 
                error: 'Code is required' 
            });
        }

        const { filePath } = await createTempFile(code, 'cpp');

        try {
            // Compile C++ code
            const compileResult = await executeWithTimeout(`g++ "${filePath}" -o "${filePath}.out"`);
            
            if (!compileResult.success) {
                return res.status(400).json({
                    success: false,
                    output: '',
                    error: `Compilation failed: ${compileResult.error}`
                });
            }

            // Execute compiled binary
            const result = await executeWithTimeout(`"${filePath}.out"`);
            
            if (result.success) {
                return res.status(200).json({
                    success: true,
                    output: result.output,
                    error: result.error || ''
                });
            } else {
                return res.status(400).json({
                    success: false,
                    output: '',
                    error: result.error
                });
            }
        } finally {
            // Clean up both source and binary files
            await cleanupTempFile(filePath);
            try {
                await fs.unlink(`${filePath}.out`);
            } catch (error) {
                // no-op
            }
        }

    } catch (error) {
        return res.status(500).json({
            success: false,
            error: 'Internal server error during C++ execution'
        });
    }
};

// Run Java code
export const runJava = async (req, res) => {
    try {
        const { code } = req.body;

        if (!code) {
            return res.status(400).json({ 
                success: false, 
                error: 'Code is required' 
            });
        }

        const { filePath } = await createTempFile(code, 'java');

        try {
            // Compile Java code
            const compileResult = await executeWithTimeout(`javac "${filePath}"`);
            
            if (!compileResult.success) {
                return res.status(400).json({
                    success: false,
                    output: '',
                    error: `Compilation failed: ${compileResult.error}`
                });
            }

            // Get class name (assuming it matches the filename)
            const className = path.basename(filePath, '.java');
            const classPath = path.dirname(filePath);

            // Execute compiled class
            const result = await executeWithTimeout(`java -cp "${classPath}" ${className}`);
            
            if (result.success) {
                return res.status(200).json({
                    success: true,
                    output: result.output,
                    error: result.error || ''
                });
            } else {
                return res.status(400).json({
                    success: false,
                    output: '',
                    error: result.error
                });
            }
        } finally {
            // Clean up source and class files
            await cleanupTempFile(filePath);
            try {
                const classFile = filePath.replace('.java', '.class');
                await fs.unlink(classFile);
            } catch (error) {
                // no-op
            }
        }

    } catch (error) {
        return res.status(500).json({
            success: false,
            error: 'Internal server error during Java execution'
        });
    }
};

// Health check endpoint
export const healthCheck = async (req, res) => {
    try {
        const pythonTest = await executeWithTimeout('python3 --version');
        const nodeTest = await executeWithTimeout('node --version');
        const gccTest = await executeWithTimeout('g++ --version');
        const javaTest = await executeWithTimeout('java --version');
        
        return res.status(200).json({
            success: true,
            message: 'Code execution service is healthy',
            services: {
                python: pythonTest.success ? 'Available' : 'Not available',
                node: nodeTest.success ? 'Available' : 'Not available',
                gcc: gccTest.success ? 'Available' : 'Not available',
                java: javaTest.success ? 'Available' : 'Not available'
            },
            details: {
                pythonVersion: pythonTest.success ? pythonTest.output.trim() : 'N/A',
                nodeVersion: nodeTest.success ? nodeTest.output.trim() : 'N/A',
                gccVersion: gccTest.success ? gccTest.output.trim() : 'N/A',
                javaVersion: javaTest.success ? javaTest.output.trim() : 'N/A'
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: 'Health check failed'
        });
    }
};

// Get supported languages
export const getSupportedLanguages = async (req, res) => {
    try {
        const languages = [
            {
                name: 'python',
                displayName: 'Python',
                description: 'Python programming language',
                version: '3.x',
                fileExtension: '.py',
                requiresCompilation: false
            },
            {
                name: 'javascript',
                displayName: 'JavaScript',
                description: 'Node.js JavaScript runtime',
                version: 'Node.js',
                fileExtension: '.js',
                requiresCompilation: false
            },
            {
                name: 'cpp',
                displayName: 'C++',
                description: 'C++ programming language',
                version: 'GCC',
                fileExtension: '.cpp',
                requiresCompilation: true
            },
            {
                name: 'java',
                displayName: 'Java',
                description: 'Java programming language',
                version: 'OpenJDK',
                fileExtension: '.java',
                requiresCompilation: true
            }
        ];

        return res.status(200).json({
            success: true,
            languages: languages
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: 'Failed to get supported languages'
        });
    }
};

// Test endpoint
export const testEndpoint = async (req, res) => {
    try {
        return res.status(200).json({
            success: true,
            message: 'Playground controller is working!',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: 'Test endpoint failed'
        });
    }
};