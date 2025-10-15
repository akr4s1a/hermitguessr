export default class GameUtils {

    static distance(x1, x2, z1, z2) {
        return Math.sqrt((x1 - x2) ** 2 + (z1 - z2) ** 2);
    }

    static calculateScore(distance) {
        let score = -2 * (distance / 4) + 105;
        return Math.round(Math.max(0, Math.min(100, score)));
    }

    static levenshtein(a, b) {
        if (a.length === 0) return b.length;
        if (b.length === 0) return a.length;

        let matrix = Array.from({ length: b.length + 1 }, (_, i) => [i]);
        for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                let cost = b.charAt(i - 1) === a.charAt(j - 1) ? 0 : 1;
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + cost,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
        return matrix[b.length][a.length];
    }

    static generateCode() {
        return Math.floor(Math.random() * 96777215).toString(16);
    }
}