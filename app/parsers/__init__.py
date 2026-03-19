"""Bank-specific CSV parsers. Each parser implements the normalizer contract."""

from app.parsers.chase import ChaseParser
from app.parsers.boa import BoAParser
from app.parsers.apple_card import AppleCardParser
from app.parsers.wells_fargo import WellsFargoParser

# Registry: bank_type (str) -> parser instance
PARSERS = {
    "chase": ChaseParser(),
    "boa": BoAParser(),
    "apple_card": AppleCardParser(),
    "wells_fargo": WellsFargoParser(),
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
