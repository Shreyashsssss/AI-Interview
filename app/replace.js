import { replaceInFileSync } from 'replace-in-file';

const optionsWhiteText = {
    files: '**/*.tsx',
    from: /color:\s*['"]white['"]/g,
    to: "color: 'var(--text-primary)'",
};

const optionsWhiteTextHex = {
    files: '**/*.tsx',
    from: /color:\s*['"]#ffffff['"]/gi,
    to: "color: 'var(--text-primary)'",
};

const optionsBlackText = {
    files: '**/*.tsx',
    from: /color:\s*['"]black['"]/gi,
    to: "color: 'var(--text-primary)'",
};

const optionsBlackTextHex = {
    files: '**/*.tsx',
    from: /color:\s*['"]#000000['"]/gi,
    to: "color: 'var(--text-primary)'",
};


try {
    let results = replaceInFileSync(optionsWhiteText);
    console.log('Replacement results:', results.filter(r => r.hasChanged).length);
    results = replaceInFileSync(optionsWhiteTextHex);
    console.log('Replacement results:', results.filter(r => r.hasChanged).length);
    results = replaceInFileSync(optionsBlackText);
    console.log('Replacement results:', results.filter(r => r.hasChanged).length);
    results = replaceInFileSync(optionsBlackTextHex);
    console.log('Replacement results:', results.filter(r => r.hasChanged).length);
} catch (error) {
    console.error('Error occurred:', error);
}
