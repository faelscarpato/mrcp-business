const textOriginal = `CONTRATO DE LOCAÇÃO

Cláusula 1 - Objeto
O objeto é bla bla bla conforme a Cláusula 2 e o Art. 5.

Cláusula 2 - Preço
O preço é R$ 100,00 nos termos da cláusula 1.

Artigo 5 - Foro
Foro de SP.

Parágrafo único - multa
Multa de 10%
`;
const text = textOriginal.toLowerCase();
const blockRegex = /^(?:Cl[áa]usula\s+[\w\d]+[.\-]?|Art(?:igo|\.)?\s+\d+[.\-]?|Par[áa]grafo\s+(?:[úu]nico|\d+)[.\-]?)/igm;
const extractedBlocks = [];
const blocksMatches = [...textOriginal.matchAll(blockRegex)];

if (blocksMatches.length > 0) {
    if (blocksMatches[0].index !== undefined && blocksMatches[0].index > 0) {
         extractedBlocks.push({
             id: 'preambulo',
             text: textOriginal.substring(0, blocksMatches[0].index).trim(),
             linksTo: []
         });
    }
    
    for (let i = 0; i < blocksMatches.length; i++) {
        const m = blocksMatches[i];
        const nextM = blocksMatches[i+1];
        const textContent = textOriginal.substring(m.index, nextM ? nextM.index : textOriginal.length).trim();
        const header = m[0].trim().toLowerCase();
        
        let id = 'bloco_' + i;
        if (header.includes('clá') || header.includes('cla')) {
            const numMatch = header.match(/cl[áa]usula\s+([\w\d]+)/i);
            id = 'clausula_' + (numMatch ? numMatch[1].toLowerCase() : i);
        } else if (header.includes('art')) {
            const numMatch = header.match(/art(?:igo|\.)?\s+(\d+)/i);
            id = 'artigo_' + (numMatch ? numMatch[1] : i);
        } else if (header.includes('par')) {
            const numMatch = header.match(/par[áa]grafo\s+([úu]nico|\d+)/i);
            id = 'paragrafo_' + (numMatch ? numMatch[1].toLowerCase() : i);
        }
        
        extractedBlocks.push({
            id,
            text: textContent,
            linksTo: []
        });
    }
}

for (const b of extractedBlocks) {
    const refs = [];
    const refMatch = [...b.text.matchAll(/cl[áa]usula\s+(?<ref_clausula>[\w\d]+)/gi)];
    for (const rm of refMatch) {
         const refVal = rm.groups?.ref_clausula?.toLowerCase();
         if (refVal) {
             const refId = 'clausula_' + refVal;
             if (refId !== b.id) refs.push(refId);
         }
    }
    
    const artMatch = [...b.text.matchAll(/art(?:igo|\.)?\s+(?<ref_artigo>\d+)/gi)];
    for (const am of artMatch) {
         const refVal = am.groups?.ref_artigo;
         if (refVal) {
             const refId = 'artigo_' + refVal;
             if (refId !== b.id) refs.push(refId);
         }
    }
    
    b.linksTo = [...new Set(refs)];
}

console.log(JSON.stringify(extractedBlocks, null, 2));
