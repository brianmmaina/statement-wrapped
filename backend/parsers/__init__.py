"""
Bank-specific CSV parsers. Each parser implements the normalizer contract.
"""

from parsers.chase import ChaseParser

# Registry: bank_type (str) -> parser instance
PARSERS = {
    "chase": ChaseParser(),
}

# Supported bank types for validation
SUPPORTED_BANKS = frozenset(PARSERS.keys())


def get_parser(bank_type: str):
    """Return the parser for the given bank type. Raises KeyError if unsupported."""
    return PARSERS[bank_type]


def parse_file(bank_type: str, file) -> list:
    """Parse a CSV file for the given bank type. Returns list of NormalizedTransaction."""
    parser = get_parser(bank_type)
    return parser.parse(file)
